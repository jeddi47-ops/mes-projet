'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MessageSquare, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { PageLoader } from '@/components/ui/Spinner';
import { messagesService } from '@/services/messages';
import { useAuthStore } from '@/store/authStore';
import type { ConversationSummary, Message } from '@/types';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const preselectedUser = searchParams.get('user');
  const qc = useQueryClient();

  const [selectedConv, setSelectedConv] = useState<ConversationSummary | null>(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: messagesService.adminConversations,
    refetchInterval: 8000,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ['conversation', selectedConv?.user_id],
    queryFn: () => messagesService.conversation(selectedConv!.user_id),
    enabled: !!selectedConv,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ receiver_id, content }: { receiver_id: string; content: string }) =>
      messagesService.send(receiver_id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', selectedConv?.user_id] });
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
      setInput('');
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select user from URL param
  useEffect(() => {
    if (preselectedUser && conversations.length > 0) {
      const conv = conversations.find((c) => c.user_id === preselectedUser);
      if (conv) setSelectedConv(conv);
    }
  }, [preselectedUser, conversations]);

  const filteredConvs = conversations.filter((c) =>
    c.user_name.toLowerCase().includes(search.toLowerCase()) ||
    c.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConv) return;
    sendMutation.mutate({ receiver_id: selectedConv.user_id, content: input.trim() });
  };

  return (
    <div>
      <Header title="Messages" subtitle="Conversations avec vos clients" />

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex" style={{ height: 'calc(100vh - 160px)' }}>

          {/* Left — Conversation list */}
          <div className="w-[300px] flex-shrink-0 border-r border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convsLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
              {!convsLoading && filteredConvs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">Aucune conversation</p>
                </div>
              )}
              {filteredConvs.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 ${
                    selectedConv?.user_id === conv.user_id ? 'bg-indigo-50/60' : ''
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 text-sm font-semibold">
                      {conv.user_name[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 truncate">{conv.user_name}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                        {formatDistanceToNow(new Date(conv.last_message_at), { locale: fr, addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right — Chat window */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                <MessageSquare className="w-12 h-12 opacity-30" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-semibold">
                      {selectedConv.user_name[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedConv.user_name}</p>
                    <p className="text-xs text-slate-400">{selectedConv.user_email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {msgsLoading && (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isAdmin = msg.sender_id !== selectedConv.user_id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 self-end">
                              <User className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                          )}
                          <div className={`max-w-[65%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-2.5 h-2.5 text-slate-300" />
                              <span className="text-[10px] text-slate-400">
                                {format(new Date(msg.created_at), 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="px-5 py-4 border-t border-slate-100 flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Répondre à ${selectedConv.user_name}...`}
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sendMutation.isPending}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {sendMutation.isPending
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send className="w-4 h-4 text-white" />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
