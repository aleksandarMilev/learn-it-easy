import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TutorsPage } from '@/pages/tutors/TutorsPage';
import { TutorDetailPage } from '@/pages/tutors/TutorDetailPage';
import { BookingsPage } from '@/pages/bookings/BookingsPage';
import { BookingDetailPage } from '@/pages/bookings/BookingDetailPage';
import { MessagesPage } from '@/pages/messages/MessagesPage';
import { ConversationPage } from '@/pages/messages/ConversationPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminTutorsPage } from '@/pages/admin/AdminTutorsPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { Layout } from '@/components/layout/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  ProtectedRoute,
  GuestRoute,
  AdminRoute,
} from '@/components/layout/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1_000 * 60 * 5,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tutors" element={<TutorsPage />} />
              <Route path="/tutors/:id" element={<TutorDetailPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:id" element={<ConversationPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/tutors"
                element={
                  <AdminRoute>
                    <AdminTutorsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <AdminRoute>
                    <AdminBookingsPage />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
      <ConfirmDialog />
    </QueryClientProvider>
  );
}
