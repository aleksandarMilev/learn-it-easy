import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '@/api/bookings.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { BookingStatus } from '@/types';

const statusColors: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isTutor, isAdmin } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsApi.getById(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: BookingStatus) => bookingsApi.updateStatus(id!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return <div className="py-24 text-center text-gray-500">Booking not found</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/bookings" className="text-sm text-indigo-600 hover:underline">
          ← Back to bookings
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{booking.subject}</h1>
            <p className="mt-1 text-sm text-gray-500">
              with {getFullName(booking.student.profile)}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[booking.status]}`}
          >
            {booking.status}
          </span>
        </div>

        <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Start</span>
            <span className="font-medium text-gray-900">{formatDateTime(booking.startTime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">End</span>
            <span className="font-medium text-gray-900">{formatDateTime(booking.endTime)}</span>
          </div>
          {booking.notes && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Notes</span>
              <span className="font-medium text-gray-900">{booking.notes}</span>
            </div>
          )}
        </div>

        {(isTutor || isAdmin) && booking.status === 'PENDING' && (
          <div className="mt-6 flex gap-3 border-t border-gray-100 pt-6">
            <button
              onClick={() => statusMutation.mutate('CONFIRMED')}
              disabled={statusMutation.isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Confirm
            </button>
            <button
              onClick={() => statusMutation.mutate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
