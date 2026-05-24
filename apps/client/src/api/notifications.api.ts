import { api } from '@/lib/axios';
import type { Notification } from '@/types';

export const notificationsApi = {
  getAll: (): Promise<Notification[]> =>
    api.get<Notification[]>('/notifications').then((r) => r.data),

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string): Promise<Notification> =>
    api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),

  delete: (id: string): Promise<void> => api.delete(`/notifications/${id}`),
};
