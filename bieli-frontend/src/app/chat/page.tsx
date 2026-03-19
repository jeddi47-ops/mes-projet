'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, MessageCircle, ArrowLeft, Circle } from 'lucide-react';
import Header from '@/components/layout/Header';

interface Message {
  id: number;
  sender: 'user' | 'seller';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, sender: 'seller', text: 'Bonjour ! Bienvenue chez bieli. Comment puis-je vous aider aujourd\'hui ?', time: '10:02' },
  { id: 2, sender: 'user', text: 'Bonjour ! Je m\'intéresse aux casques sans fil. Sont-ils toujours disponibles ?', time: '10:05' },
  { id: 3, sender: 'seller', text: 'Oui, absolument ! Nous avons les casques Wireless Noise-Cancelling en stock. Vous avez un excellent goût !', time: '10:06' },
  { id: 4, sender: 'user', text: 'Super ! Y a-t-il des promotions en cours ?', time: '10:08' },
  { id: 5, sender: 'seller', text: 'Oui ! Utilisez le code BIELI10 pour profiter de -10% sur votre première commande. La livraison est aussi gratuite dès 80€.', time: '10:09' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    const userMsg: Message = { id: Date.now(), sender: 'user', text: input.trim(), time };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Auto-reply
    setTimeout(() => {
      const replies = [
        'Merci pour votre message ! Je reviens vers vous dans quelques instants.',
        'Bonne question ! Laissez-moi vérifier cela pour vous.',
        'Bien sûr, je peux vous aider avec ça !',
        'Avez-vous besoin d\'autres informations sur nos produits ?',
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      const replyTime = `${now.getHours()}:${String(now.getMinutes() + 1).padStart(2, '0')}`;
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'seller', text: reply, time: replyTime }]);
    }, 1200);
  };

  return (
    <>
      <Header />
      <main data-testid="chat-page" className="pt-[56px] h-screen flex flex-col bg-bieli-bg">
        <div className="flex flex-1 max-w-5xl mx-auto w-full overflow-hidden border-x border-bieli-border bg-white" style={{ height: 'calc(100vh - 56px)' }}>

          {/* Sidebar */}
          <div className="hidden md:flex w-72 flex-col border-r border-bieli-border flex-shrink-0">
            <div className="p-5 border-b border-bieli-border">
              <Link href="/" className="inline-flex items-center gap-1 text-xs text-bieli-muted hover:text-bieli-black transition-colors mb-3">
                <ArrowLeft size={12} /> Retour à la boutique
              </Link>
              <h2 className="font-playfair text-xl font-medium">Messages</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Conversation item */}
              <div className="flex items-center gap-3 px-5 py-4 bg-bieli-soft border-l-2 border-bieli-gold cursor-pointer">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-bieli-black flex items-center justify-center text-white font-playfair font-medium text-sm">
                    B
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">Support bieli.</p>
                  <p className="text-xs text-bieli-muted truncate">Disponible maintenant</p>
                </div>
                <span className="text-[10px] text-bieli-muted">10:09</span>
              </div>
            </div>

            <div className="p-4 border-t border-bieli-border">
              <p className="text-xs text-bieli-muted text-center">Interface de chat bieli.</p>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-bieli-border">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-bieli-black flex items-center justify-center text-white font-playfair font-medium">
                  B
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Support bieli.</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Circle size={6} className="fill-green-500" /> En ligne
                </p>
              </div>
              <div className="ml-auto">
                <Link href="/" className="md:hidden text-sm text-bieli-muted hover:text-bieli-black transition-colors flex items-center gap-1">
                  <ArrowLeft size={14} /> Boutique
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4" data-testid="messages-area">
              <p className="text-center text-xs text-bieli-muted uppercase tracking-widest">Aujourd'hui</p>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  data-testid={`message-${msg.id}`}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.sender === 'seller' && (
                    <div className="w-8 h-8 rounded-full bg-bieli-black flex-shrink-0 flex items-center justify-center text-white text-xs font-playfair">
                      B
                    </div>
                  )}
                  <div className="max-w-xs md:max-w-sm">
                    <div className={`px-4 py-2.5 text-sm leading-relaxed ${msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-seller'}`}>
                      {msg.text}
                    </div>
                    <p className={`text-[10px] text-bieli-muted mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              data-testid="chat-form"
              className="flex items-center gap-3 px-5 py-4 border-t border-bieli-border"
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
                disabled={!input.trim()}
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
