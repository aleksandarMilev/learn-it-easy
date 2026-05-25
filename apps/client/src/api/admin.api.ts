import { api } from '@/lib/axios';
import type { User, TutorProfile, Booking } from '@/types';

export const adminApi = {
  getUsers: (): Promise<User[]> => api.get<User[]>('/users').then((r) => r.data),

  approveTutor: (tutorId: string): Promise<TutorProfile> =>
    api.post<TutorProfile>(`/tutors/${tutorId}/approve`).then((r) => r.data),

  deleteTutor: (tutorId: string): Promise<void> => api.delete(`/tutors/${tutorId}`),

  getAllBookings: (): Promise<Booking[]> => api.get<Booking[]>('/bookings').then((r) => r.data),
};
