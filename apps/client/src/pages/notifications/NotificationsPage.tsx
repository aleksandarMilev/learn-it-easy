import { type ElementType } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  MessageSquare,
  Star,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { notificationsApi } from '@/api/notifications.api';
import { formatDateTime } from '@/lib/utils';
import type { NotificationType } from '@/types';
import { useToast } from '@/store/toast.store';

type TypeConfig = {
  label: string;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
};

const typeConfig: Record<NotificationType, TypeConfig> = {
  BOOKING_CREATED: {
    label: 'New booking request',
    icon: CalendarPlus,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  BOOKING_CONFIRMED: {
    label: 'Booking confirmed',
    icon: CalendarCheck,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  BOOKING_CANCELLED: {
    label: 'Booking cancelled',
    icon: CalendarX,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
  },
  NEW_MESSAGE: {
    label: 'New message',
    icon: MessageSquare,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  REVIEW_RECEIVED: {
    label: 'New review',
    icon: Star,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
  },
};

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: notifications, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  });

  const readMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      toast.info('Notification marked as read.');
    },
    onError: () => toast.error('Failed to mark notification as read.'),
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      toast.info('Notification deleted.');
    },
    onError: () => toast.error('Failed to delete notification.'),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shimmer h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-3 w-28 rounded" />
                  <div className="shimmer h-4 w-48 rounded" />
                  <div className="shimmer h-3 w-full rounded" />
                </div>
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
    <div className="mx-auto max-w-2xl animate-fade-in-up space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

      {notifications?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Bell className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">All caught up</h3>
          <p className="mt-1 text-sm text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications?.map((notification) => {
            const config = typeConfig[notification.type];
            const TypeIcon = config.icon;

            return (
              <div
                key={notification.id}
                className={`rounded-xl border p-5 shadow-sm transition-colors ${
                  notification.isRead
                    ? 'border-gray-200 bg-white'
                    : 'border-indigo-200 bg-indigo-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}
                  >
                    <TypeIcon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-400">{config.label}</p>
                      {!notification.isRead && (
                        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <p className="mt-0.5 font-semibold text-gray-900">{notification.title}</p>
                    <p className="mt-0.5 text-sm text-gray-600">{notification.body}</p>
                    <p className="mt-1.5 text-xs text-gray-400">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={() => readMutation.mutate(notification.id)}
                        disabled={readMutation.isPending}
                        title="Mark as read"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-50"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(notification.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
