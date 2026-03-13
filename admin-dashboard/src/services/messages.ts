import api from './api';
import type { Message, ConversationSummary } from '@/types';

export const messagesService = {
  conversations: async (): Promise<ConversationSummary[]> => {
    const { data } = await api.get<ConversationSummary[]>('/api/messages');
    return data;
  },
  adminConversations: async (): Promise<ConversationSummary[]> => {
    const { data } = await api.get<ConversationSummary[]>('/api/admin/messages');
    return data;
  },
  conversation: async (userId: string): Promise<Message[]> => {
    const { data } = await api.get<Message[]>(`/api/messages/conversation/${userId}`);
    return data;
  },
  send: async (receiver_id: string, content: string): Promise<Message> => {
    const { data } = await api.post<Message>('/api/messages/send', { receiver_id, content });
    return data;
  },
};
