import { api } from '@/lib/axios';
import type { Conversation, Message } from '@/types';

export const messagingApi = {
  getConversations: (): Promise<Conversation[]> =>
    api.get<Conversation[]>('/messages/conversations').then((r) => r.data),

  getMessages: (conversationId: string): Promise<Message[]> =>
    api.get<Message[]>(`/messages/conversations/${conversationId}`).then((r) => r.data),

  createConversation: (tutorUserId: string): Promise<Conversation> =>
    api.post<Conversation>('/messages/conversation', { tutorUserId }).then((r) => r.data),

  deleteMessage: (id: string): Promise<void> => api.delete(`/messages/messages/${id}`),
};
