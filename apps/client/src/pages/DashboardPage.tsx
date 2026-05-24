import { type ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Bell,
  Shield,
  GraduationCap,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { bookingsApi } from '@/api/bookings.api';
import { notificationsApi } from '@/api/notifications.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const statusColors: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

type StatItem = {
  label: string;
  value: string | number;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  valueColor: string;
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.getAll,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.getUnreadCount,
  });

  const upcomingBookings =
    bookings?.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED') ?? [];

  const roleName = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : '—';

  const stats: StatItem[] = [
    {
      label: 'Upcoming sessions',
      value: upcomingBookings.length,
      icon: CalendarDays,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      valueColor: 'text-indigo-600',
    },
    {
      label: 'Unread notifications',
      value: unreadCount?.count ?? 0,
      icon: Bell,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      valueColor: 'text-amber-600',
    },
    {
      label: 'Account type',
      value: roleName,
      icon: Shield,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      valueColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="animate-fade-in-up space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your account.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, iconColor, iconBg, valueColor }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
            >
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`mt-0.5 text-2xl font-bold ${valueColor}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming bookings */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Upcoming sessions</h2>
          <Link
            to="/bookings"
            className="flex items-center gap-1 text-sm text-indigo-600 transition-colors hover:text-indigo-700"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <GraduationCap className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900">No upcoming sessions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Book a session with a tutor to get started.
            </p>
            <Link
              to="/tutors"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <GraduationCap className="h-4 w-4" />
              Find a tutor
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcomingBookings.slice(0, 5).map((booking) => (
              <li key={booking.id}>
                <Link
                  to={`/bookings/${booking.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                      <CalendarDays className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.subject}</p>
                      <p className="text-xs text-gray-500">{getFullName(booking.student.profile)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="hidden text-xs text-gray-400 sm:block">
                      {formatDateTime(booking.startTime)}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[booking.status]}`}
                    >
                      {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="font-semibold text-indigo-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/tutors"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <GraduationCap className="h-4 w-4" />
            Find a tutor
          </Link>
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <CalendarDays className="h-4 w-4" />
            My bookings
          </Link>
          <Link
            to="/messages"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </Link>
        </div>
      </div>
    </div>
  );
}
