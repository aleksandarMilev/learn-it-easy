import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { formatDateTime } from '@/lib/utils';
import type { NotificationType } from '@/types';

const typeLabels: Record<NotificationType, string> = {
  BOOKING_CREATED: '📅 New booking request',
  BOOKING_CONFIRMED: '✅ Booking confirmed',
  BOOKING_CANCELLED: '❌ Booking cancelled',
  NEW_MESSAGE: '💬 New message',
  REVIEW_RECEIVED: '⭐ New review',
};

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  });

  const readMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

      {notifications?.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <p className="text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-xl border p-5 shadow-sm ${
                notification.isRead ? 'border-gray-200 bg-white' : 'border-indigo-200 bg-indigo-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">
                    {typeLabels[notification.type]}
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">{notification.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{notification.body}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => readMutation.mutate(notification.id)}
                      disabled={readMutation.isPending}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(notification.id)}
                    disabled={deleteMutation.isPending}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {(readMutation.isError || deleteMutation.isError) && (
                <p className="mt-3 text-sm text-red-500">Something went wrong. Please try again.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
