'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, ArrowLeft, Circle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/lib/authStore';
import api from '@/lib/api';
import { Message } from '@/types';

const POLL_INTERVAL = 2500;

interface Conversation {
  user_id: string;
  user_name: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export default function ChatPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('Support nel.store');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const poll = async () => {
    try {
      // Step 1: Get conversations list
      const convRes = await api.get<Conversation[]>('/messages');
      const convList = Array.isArray(convRes.data) ? convRes.data : [];

      if (convList.length > 0) {
        const conv = convList[0];
        setPartnerId(conv.user_id);
        setPartnerName(conv.user_name || 'Support nel.store');

        // Step 2: Get actual messages for this conversation
        const msgRes = await api.get<Message[]>(`/messages/conversation/${conv.user_id}`);
        const msgs = Array.isArray(msgRes.data) ? msgRes.data : [];
        setMessages(msgs);
      }
    } catch {
      // Keep current state on error
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [mounted, isAuthenticated]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      sender_id: user?.id || '',
      receiver_id: null,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await api.post('/messages/send', { content: text, receiver_id: null });
      await poll(); // Refresh to get real message
    } catch (err: unknown) {
      // Rollback optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? '';
      if (detail.toLowerCase().includes('admin')) {
        toast.error('Fonctionnalité réservée aux comptes clients.', {
          description: 'Connectez-vous avec un compte client pour contacter le support.',
        });
      } else {
        toast.error('Impossible d\'envoyer le message.');
      }
    } finally {
      setSending(false);
    }
  };

  if (!mounted) {
    return (
      <>
        <Header />
        <div className="pt-[56px] min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-bieli-border border-t-bieli-gold rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="pt-[56px] min-h-screen flex items-center justify-center bg-bieli-bg">
          <div className="text-center max-w-sm px-4" data-testid="chat-login-prompt">
            <div className="w-16 h-16 border border-bieli-border rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={20} className="text-bieli-muted" />
            </div>
            <h2 className="font-playfair text-2xl font-medium mb-3">
              Connectez-vous pour discuter
            </h2>
            <p className="text-sm text-bieli-gray mb-8">
              Accédez à notre chat support en vous connectant à votre compte nel.store.
            </p>
            <Link
              href="/login"
              data-testid="chat-login-link"
              className="inline-block px-8 py-3 bg-bieli-black text-white text-sm hover:bg-bieli-gray transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        data-testid="chat-page"
        className="pt-[56px] bg-bieli-bg"
        style={{ height: '100dvh' }}
      >
        <div
          className="flex max-w-5xl mx-auto w-full border-x border-bieli-border bg-white overflow-hidden"
          style={{ height: 'calc(100dvh - 56px - 30px)' }}
        >
          {/* ── Sidebar ── */}
          <div className="hidden md:flex w-72 flex-col border-r border-bieli-border flex-shrink-0">
            <div className="p-5 border-b border-bieli-border">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-bieli-muted hover:text-bieli-black transition-colors mb-3"
              >
                <ArrowLeft size={12} /> Retour à la boutique
              </Link>
              <h2 className="font-playfair text-xl font-medium">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 px-5 py-4 bg-bieli-soft border-l-2 border-bieli-gold cursor-pointer">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-bieli-black flex items-center justify-center text-white font-playfair font-medium text-sm">
                    B
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">Support nel.store</p>
                  <p className="text-xs text-bieli-muted truncate">
                    {messages.length > 0
                      ? `${messages.length} message${messages.length > 1 ? 's' : ''}`
                      : 'Disponible maintenant'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-bieli-border">
              <p className="text-xs text-bieli-muted text-center truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* ── Chat area ── */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-bieli-border flex-shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-bieli-black flex items-center justify-center text-white font-playfair font-medium">
                  B
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{partnerName}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Circle size={6} className="fill-green-500" /> En ligne
                </p>
              </div>
              <div className="ml-auto">
                <Link
                  href="/"
                  className="md:hidden text-sm text-bieli-muted hover:text-bieli-black transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Boutique
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-5 py-6 space-y-4"
              data-testid="messages-area"
            >
              <p className="text-center text-xs text-bieli-muted uppercase tracking-widest">
                Aujourd'hui
              </p>

              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-bieli-gray font-medium mb-1">
                    Commencez la conversation !
                  </p>
                  <p className="text-xs text-bieli-muted">
                    Notre équipe vous répond dans les plus brefs délais.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                const time = msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={msg.id}
                    data-testid={`message-${msg.id}`}
                    className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-full bg-bieli-black flex-shrink-0 flex items-center justify-center text-white text-xs font-playfair">
                        B
                      </div>
                    )}
                    <div className="max-w-xs md:max-w-sm">
                      <div
                        className={`px-4 py-2.5 text-sm leading-relaxed ${
                          isOwn ? 'chat-bubble-user' : 'chat-bubble-seller'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {time && (
                        <p
                          className={`text-[10px] text-bieli-muted mt-1 ${isOwn ? 'text-right' : ''}`}
                        >
                          {time}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              data-testid="chat-form"
              className="flex items-center gap-3 px-5 py-4 border-t border-bieli-border flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre message..."
                data-testid="chat-input"
                className="flex-1 bg-bieli-soft px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-bieli-gold transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                data-testid="send-btn"
                className="w-10 h-10 bg-bieli-black hover:bg-bieli-gray disabled:opacity-30 text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
