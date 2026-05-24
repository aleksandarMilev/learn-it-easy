import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { bookingsApi } from '@/api/bookings.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { BookingStatus } from '@/types';

const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmed', classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Completed', classes: 'bg-gray-100 text-gray-600' },
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isTutor, isAdmin } = useAuth();

  const { data: booking, isLoading, isError } = useQuery({
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
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="shimmer h-4 w-32 rounded" />
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
          <div className="shimmer h-7 w-48 rounded" />
          <div className="shimmer h-4 w-36 rounded" />
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
            <div className="shimmer h-4 w-full rounded" />
            <div className="shimmer h-4 w-full rounded" />
          </div>
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

  if (!booking) {
    return <div className="py-24 text-center text-gray-500">Booking not found</div>;
  }

  const status = statusConfig[booking.status];

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up space-y-6">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 transition-colors hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{booking.subject}</h1>
            <p className="mt-1 text-sm text-gray-500">
              with {getFullName(booking.student.profile)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${status.classes}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Calendar className="h-4 w-4 text-gray-500" />
            </div>
            <span className="w-16 shrink-0 text-gray-500">Start</span>
            <span className="font-medium text-gray-900">{formatDateTime(booking.startTime)}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <span className="w-16 shrink-0 text-gray-500">End</span>
            <span className="font-medium text-gray-900">{formatDateTime(booking.endTime)}</span>
          </div>

          {booking.notes && (
            <div className="flex items-start gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
              <span className="w-16 shrink-0 pt-0.5 text-gray-500">Notes</span>
              <span className="font-medium text-gray-900">{booking.notes}</span>
            </div>
          )}
        </div>

        {(isTutor || isAdmin) && booking.status === 'PENDING' && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="mb-3 text-sm font-medium text-gray-700">Actions</p>
            <div className="flex gap-3">
              <button
                onClick={() => statusMutation.mutate('CONFIRMED')}
                disabled={statusMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm
              </button>
              <button
                onClick={() => statusMutation.mutate('CANCELLED')}
                disabled={statusMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel
              </button>
            </div>
            {statusMutation.isError && (
              <p className="mt-2 text-sm text-red-500">Something went wrong. Please try again.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
