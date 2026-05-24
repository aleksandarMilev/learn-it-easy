export type Role = 'STUDENT' | 'TUTOR' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'NEW_MESSAGE'
  | 'REVIEW_RECEIVED';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  profile: Profile | null;
}

export interface Profile {
  firstName: string;
  lastName: string;
  bio: string | null;
}

export interface TutorProfile {
  id: string;
  userId: string;
  subjects: string[];
  hourlyRate: number;
  bio: string | null;
  isApproved: boolean;
  user: { id: string; profile: Profile | null };
  availability: Availability[];
}

export interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  studentId: string;
  tutorId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  subject: string;
  notes: string | null;
  createdAt: string;
  tutor: { id: string; subjects: string[]; hourlyRate: number };
  student: { id: string; profile: Profile | null };
  review: Review | null;
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  studentId: string;
  tutorId: string;
  student: { id: string; profile: Profile | null };
  tutor: { id: string; profile: Profile | null };
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; profile: Profile | null };
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}
