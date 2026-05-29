import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { formatDateTime, getFullName } from '@/lib/utils';
import type { BookingStatus } from '@/types';

const statusClasses: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

export function AdminBookingsPage() {
  const [activeFilter, setActiveFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const { t } = useTranslation();

  const filterTabs: Array<{ value: BookingStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: t('admin.filterAll') },
    { value: 'PENDING', label: t('bookings.status.pending') },
    { value: 'CONFIRMED', label: t('bookings.status.confirmed') },
    { value: 'COMPLETED', label: t('bookings.status.completed') },
    { value: 'CANCELLED', label: t('bookings.status.cancelled') },
  ];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: ({ pageParam }) => adminApi.getAllBookings(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const allBookings = data?.pages.flatMap((page) => page.data) ?? [];
  const filteredBookings =
    activeFilter === 'ALL'
      ? allBookings
      : allBookings.filter((booking) => booking.status === activeFilter);

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
        <p className="text-sm text-red-500">{t('errors.somethingWentWrong')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">
          {t('admin.allBookings')}{' '}
          <span className="text-lg font-normal text-gray-400">
            ({allBookings.length}{hasNextPage ? '+' : ''})
          </span>
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
          <p className="text-sm text-gray-500">{t('admin.noBookings')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{booking.subject}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses[booking.status]}`}
                    >
                      {t(`bookings.status.${booking.status.toLowerCase()}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t('bookingDetail.with')}{' '}
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
                  <p className="text-sm font-semibold text-indigo-600">
                    ${booking.tutor.hourlyRate}{t('common.perHour')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(hasNextPage || isFetchingNextPage) && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronDown className="h-4 w-4" />
            {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
          </button>
        </div>
      )}

      {!hasNextPage && allBookings.length > 0 && (
        <p className="text-center text-xs text-gray-400">{t('common.noMoreItems')}</p>
      )}
    </div>
  );
}
