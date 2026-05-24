import { api } from '@/lib/axios';
import type { AuthResponse } from '@/types';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TUTOR';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  logout: (refreshToken: string): Promise<void> => api.post('/auth/logout', { refreshToken }),

  refresh: (refreshToken: string): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),
};
