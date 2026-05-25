import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const statusConfig: Record<BookingStatus, { label: string; classes: string }> = {
  PENDING: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmed', classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
  COMPLETED: { label: 'Completed', classes: 'bg-gray-100 text-gray-600' },
};

const filterTabs: Array<{ value: BookingStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function AdminBookingsPage() {
  const [activeFilter, setActiveFilter] = useState<BookingStatus | 'ALL'>('ALL');

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: adminApi.getAllBookings,
  });

  const filteredBookings =
    activeFilter === 'ALL'
      ? (bookings ?? [])
      : (bookings?.filter((booking) => booking.status === activeFilter) ?? []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-8 w-48 rounded" />
        <div className="shimmer h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="shimmer h-28 rounded-xl" />
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
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">
          All Bookings{' '}
          <span className="text-lg font-normal text-gray-400">({bookings?.length ?? 0})</span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === value
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
          <CalendarDays className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No bookings found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const status = statusConfig[booking.status];

            return (
              <div
                key={booking.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{booking.subject}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Student:{' '}
                      <span className="text-gray-700">
                        {getFullName(booking.student.profile)}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {booking.tutor.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 space-y-1 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(booking.startTime)}
                    </p>
                    <p className="text-sm text-indigo-600 font-semibold">
                      ${booking.tutor.hourlyRate}/hr
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
