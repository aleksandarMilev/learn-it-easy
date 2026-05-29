import { api } from '@/lib/axios';
import type { Booking, BookingStatus, PaginatedResult } from '@/types';

export interface CreateBookingPayload {
  tutorId: string;
  startTime: string;
  endTime: string;
  subject: string;
  notes?: string;
}

export const bookingsApi = {
  getAll: (cursor?: string): Promise<PaginatedResult<Booking>> =>
    api
      .get<PaginatedResult<Booking>>('/bookings', {
        params: { cursor, take: 20 },
      })
      .then((r) => r.data),

  getById: (id: string): Promise<Booking> =>
    api.get<Booking>(`/bookings/${id}`).then((r) => r.data),

  create: (payload: CreateBookingPayload): Promise<Booking> =>
    api.post<Booking>('/bookings', payload).then((r) => r.data),

  updateStatus: (id: string, status: BookingStatus): Promise<Booking> =>
    api.patch<Booking>(`/bookings/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string): Promise<void> => api.delete(`/bookings/${id}`),
};
