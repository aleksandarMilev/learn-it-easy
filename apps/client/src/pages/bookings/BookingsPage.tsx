import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { bookingsApi } from '@/api/bookings.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const statusColors: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
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
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>

      {bookings?.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <p className="text-gray-500">No bookings yet.</p>
          <Link to="/tutors" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
            Find a tutor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    to={`/bookings/${booking.id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {booking.subject}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">
                    with {getFullName(booking.student.profile)}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDateTime(booking.startTime)} → {formatDateTime(booking.endTime)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => cancelMutation.mutate(booking.id)}
                      disabled={cancelMutation.isPending}
                      className="text-sm text-red-500 hover:underline disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {cancelMutation.isError && (
                <p className="mt-3 text-sm text-red-500">Something went wrong. Please try again.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
