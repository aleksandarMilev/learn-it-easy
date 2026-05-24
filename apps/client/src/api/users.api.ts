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

  uploadAvatar: (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api
      .post<User>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  removeAvatar: (): Promise<User> =>
    api.delete<User>('/users/me/avatar').then((r) => r.data),
};
