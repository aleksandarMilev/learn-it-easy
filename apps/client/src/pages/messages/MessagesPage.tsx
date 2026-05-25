import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, GraduationCap, ChevronRight } from 'lucide-react';
import { messagingApi } from '@/api/messaging.api';
import { getFullName, formatDateTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';

export function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  const { data: conversations, isLoading, isError } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagingApi.getConversations,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('messages.title')}</h1>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-4">
              <div className="shimmer h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="shimmer h-4 w-32 rounded" />
                <div className="shimmer h-3 w-48 rounded" />
              </div>
              <div className="shimmer h-3 w-16 rounded" />
            </div>
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
    <div className="mx-auto max-w-2xl animate-fade-in-up space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('messages.title')}</h1>

      {conversations?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <MessageSquare className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">{t('messages.noConversations')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('messages.noConversationsHint')}</p>
          <Link
            to="/tutors"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <GraduationCap className="h-4 w-4" />
            {t('messages.browseTutors')}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {conversations?.map((conversation, index) => {
            const other =
              conversation.studentId === user?.id ? conversation.tutor : conversation.student;
            const lastMessage = conversation.messages[0];
            const isLast = index === (conversations?.length ?? 0) - 1;

            return (
              <Link
                key={conversation.id}
                to={`/messages/${conversation.id}`}
                className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${
                  isLast ? '' : 'border-b border-gray-100'
                }`}
              >
                <Avatar profile={other.profile} size="md" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{getFullName(other.profile)}</p>
                  {lastMessage && (
                    <p className="truncate text-sm text-gray-500">{lastMessage.content}</p>
                  )}
                  {!lastMessage && (
                    <p className="text-sm text-gray-400 italic">{t('messages.noMessagesYet')}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {lastMessage && (
                    <p className="text-xs text-gray-400">{formatDateTime(lastMessage.createdAt)}</p>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
