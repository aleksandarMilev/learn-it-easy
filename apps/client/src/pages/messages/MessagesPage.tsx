import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { messagingApi } from '@/api/messaging.api';
import { getFullName, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export function MessagesPage() {
  const user = useAuthStore((s) => s.user);

  const { data: conversations, isLoading, isError } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagingApi.getConversations,
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
      <h1 className="text-2xl font-bold text-gray-900">Messages</h1>

      {conversations?.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <p className="text-gray-500">No conversations yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Start a conversation from a tutor's profile page.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
          {conversations?.map((conversation) => {
            const other =
              conversation.studentId === user?.id ? conversation.tutor : conversation.student;
            const lastMessage = conversation.messages[0];

            return (
              <Link
                key={conversation.id}
                to={`/messages/${conversation.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                  {other.profile?.firstName?.[0] ?? '?'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-gray-900">{getFullName(other.profile)}</p>
                  {lastMessage && (
                    <p className="truncate text-sm text-gray-500">{lastMessage.content}</p>
                  )}
                </div>
                {lastMessage && (
                  <p className="shrink-0 text-xs text-gray-400">
                    {formatDateTime(lastMessage.createdAt)}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
