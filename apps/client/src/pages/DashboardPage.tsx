import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { bookingsApi } from '@/api/bookings.api';
import { notificationsApi } from '@/api/notifications.api';
import { formatDateTime, getFullName } from '@/lib/utils';

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.email}</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Upcoming bookings</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{upcomingBookings.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Unread notifications</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{unreadCount?.count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Role</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600 capitalize">
            {user?.role.toLowerCase()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Upcoming bookings</h2>
          <Link to="/bookings" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No upcoming bookings</p>
            <Link
              to="/tutors"
              className="mt-2 inline-block text-sm text-indigo-600 hover:underline"
            >
              Browse tutors
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {upcomingBookings.slice(0, 5).map((booking) => (
              <li key={booking.id} className="px-6 py-4">
                <Link
                  to={`/bookings/${booking.id}`}
                  className="flex items-center justify-between hover:opacity-75"
                >
                  <div>
                    <p className="font-medium text-gray-900">{booking.subject}</p>
                    <p className="text-sm text-gray-500">{getFullName(booking.student.profile)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDateTime(booking.startTime)}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
        <h2 className="font-semibold text-indigo-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/tutors"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Find a tutor
          </Link>
          <Link
            to="/bookings"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            My bookings
          </Link>
          <Link
            to="/messages"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Messages
          </Link>
        </div>
      </div>
    </div>
  );
}
