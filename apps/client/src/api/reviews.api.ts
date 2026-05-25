import { api } from '@/lib/axios';
import type { Review } from '@/types';

export interface CreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}

export const reviewsApi = {
  create: (payload: CreateReviewPayload): Promise<Review> =>
    api.post<Review>('/reviews', payload).then((r) => r.data),

  getByTutor: (tutorId: string): Promise<Review[]> =>
    api.get<Review[]>(`/reviews/tutor/${tutorId}`).then((r) => r.data),

  update: (id: string, payload: Partial<CreateReviewPayload>): Promise<Review> =>
    api.patch<Review>(`/reviews/${id}`, payload).then((r) => r.data),

  delete: (id: string): Promise<void> => api.delete(`/reviews/${id}`),
};
