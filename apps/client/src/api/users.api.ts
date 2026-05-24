import { api } from '@/lib/axios';
import type { User } from '@/types';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export const usersApi = {
  getMe: (): Promise<User> => api.get<User>('/users/me').then((r) => r.data),

  updateMe: (payload: UpdateProfilePayload): Promise<User> =>
    api.patch<User>('/users/me', payload).then((r) => r.data),

  getById: (id: string): Promise<User> => api.get<User>(`/users/${id}`).then((r) => r.data),
};
