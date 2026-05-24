import { api } from '@/lib/axios';
import type { Availability, TutorProfile } from '@/types';

export interface CreateTutorProfilePayload {
  subjects: string[];
  hourlyRate: number;
  bio?: string;
}

export interface CreateAvailabilityPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export const tutorsApi = {
  getAll: (): Promise<TutorProfile[]> => api.get<TutorProfile[]>('/tutors').then((r) => r.data),

  getById: (id: string): Promise<TutorProfile> =>
    api.get<TutorProfile>(`/tutors/${id}`).then((r) => r.data),

  createProfile: (payload: CreateTutorProfilePayload): Promise<TutorProfile> =>
    api.post<TutorProfile>('/tutors/profile', payload).then((r) => r.data),

  updateProfile: (payload: Partial<CreateTutorProfilePayload>): Promise<TutorProfile> =>
    api.patch<TutorProfile>('/tutors/profile', payload).then((r) => r.data),

  getAvailability: (id: string): Promise<Availability[]> =>
    api.get<Availability[]>(`/tutors/${id}/availability`).then((r) => r.data),

  createAvailability: (payload: CreateAvailabilityPayload): Promise<Availability> =>
    api.post<Availability>('/tutors/availability', payload).then((r) => r.data),
};
