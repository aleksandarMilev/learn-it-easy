import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, GraduationCap, Clock, XCircle } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmed', classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Completed', classes: 'bg-gray-100 text-gray-600' },
};

export function BookingsPage() {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookingsApi.getAll,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.updateStatus(id, 'CANCELLED'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="shimmer h-4 w-32 rounded" />
                  <div className="shimmer h-3 w-24 rounded" />
                  <div className="shimmer h-3 w-40 rounded" />
                </div>
                <div className="shimmer h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      {bookings?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <CalendarDays className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Find a tutor and book your first session.
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
        <div className="space-y-4">
          {bookings?.map((booking) => {
            const status = statusConfig[booking.status];
            return (
              <div
                key={booking.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                      <CalendarDays className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="font-semibold text-gray-900 transition-colors hover:text-indigo-600"
                      >
                        {booking.subject}
                      </Link>
                      <p className="mt-0.5 text-sm text-gray-500">
                        with {getFullName(booking.student.profile)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(booking.startTime)} → {formatDateTime(booking.endTime)}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${status.classes}`}
                    >
                      {status.label}
                    </span>
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => cancelMutation.mutate(booking.id)}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {cancelMutation.isError && (
                  <p className="mt-3 text-sm text-red-500">Something went wrong. Please try again.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
