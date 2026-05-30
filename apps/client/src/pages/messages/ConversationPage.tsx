import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, SendHorizonal } from 'lucide-react';
import { messagingApi } from '@/api/messaging.api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';
import { getFullName, formatTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Message, MessageStatus, OptimisticMessage } from '@/types';
import {
  addOptimisticMessage,
  confirmOptimisticMessage,
  failOptimisticMessage,
  generateNonce,
  retryOptimisticMessage,
} from './optimistic.utils';

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const socket = useSocket();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [content, setContent] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  const {
    data: messages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => messagingApi.getMessages(id!),
    enabled: !!id,
  });

  const allMessages = useMemo(
    () => [
      ...(messages ?? []).map((message) => ({ ...message, status: 'confirmed' as MessageStatus })),
      ...optimisticMessages,
    ],
    [messages, optimisticMessages],
  );

  useEffect(() => {
    if (!socket || !id) {
      return;
    }

    socket.emit('joinConversation', id);

    socket.on('receiveMessage', (message: Message & { nonce?: string }) => {
      if (message.senderId === user?.id) {
        setOptimisticMessages((previous) => {
          const matchIndex = message.nonce
            ? previous.findIndex((optimistic) => optimistic.nonce === message.nonce)
            : previous.findIndex(
                (optimistic) =>
                  optimistic.status === 'pending' &&
                  optimistic.content === message.content &&
                  optimistic.senderId === message.senderId &&
                  Math.abs(
                    new Date(optimistic.createdAt).getTime() -
                      new Date(message.createdAt).getTime(),
                  ) < 10_000,
              );

          if (matchIndex === -1) {
            return previous;
          }

          const matched = previous[matchIndex];
          if (matched?.nonce) {
            const timeoutId = pendingTimeouts.current.get(matched.nonce);
            if (timeoutId !== undefined) {
              clearTimeout(timeoutId);
              pendingTimeouts.current.delete(matched.nonce);
            }
          }

          return confirmOptimisticMessage(previous, message);
        });
        void queryClient.invalidateQueries({ queryKey: ['messages', id] });
      } else {
        setOptimisticMessages((previous) =>
          addOptimisticMessage(previous, { ...message, status: 'confirmed' as MessageStatus }),
        );
      }
    });

    socket.on('connect_error', () => {
      toast.error(t('messages.connectionError'));
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('connect_error');
    };
  }, [socket, id, toast, t, user?.id, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  useEffect(() => {
    const timeouts = pendingTimeouts.current;
    return () => {
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  const handleSend = () => {
    if (!content.trim() || !socket) {
      return;
    }

    const nonce = generateNonce();
    const trimmedContent = content.trim();

    const optimisticMessage: OptimisticMessage = {
      id: `optimistic-${nonce}`,
      conversationId: id!,
      senderId: user!.id,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      status: 'pending',
      nonce,
      sender: {
        id: user!.id,
        profile: null,
      },
    };

    setOptimisticMessages((previous) => addOptimisticMessage(previous, optimisticMessage));
    setContent('');

    socket.emit('sendMessage', { conversationId: id, content: trimmedContent, nonce });

    const timeoutId = setTimeout(() => {
      setOptimisticMessages((previous) => failOptimisticMessage(previous, nonce));
    }, 5_000);

    pendingTimeouts.current.set(nonce, timeoutId);
  };

  const handleRetry = (failedMessage: OptimisticMessage) => {
    if (!socket || !failedMessage.nonce) {
      return;
    }

    const newNonce = generateNonce();

    setOptimisticMessages((previous) =>
      retryOptimisticMessage(previous, failedMessage.nonce!, newNonce),
    );

    socket.emit('sendMessage', {
      conversationId: id,
      content: failedMessage.content,
      nonce: newNonce,
    });

    const timeoutId = setTimeout(() => {
      setOptimisticMessages((previous) => failOptimisticMessage(previous, newNonce));
    }, 5_000);

    pendingTimeouts.current.set(newNonce, timeoutId);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="shimmer mb-4 h-4 w-32 rounded" />
        <div className="h-[calc(100vh-11rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" />
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
    <div className="mx-auto max-w-2xl">
      <Link
        to="/messages"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 transition-colors hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('messages.backToMessages')}
      </Link>

      <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {allMessages.map((message) => {
            const isMe = message.senderId === user?.id;
            const isFailed = message.status === 'failed';
            const isPending = message.status === 'pending';

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && <Avatar profile={message.sender.profile} size="sm" />}
                <div
                  className={[
                    'max-w-xs rounded-2xl px-4 py-2.5 shadow-sm lg:max-w-sm',
                    isMe && isFailed
                      ? 'bg-red-100 text-red-900'
                      : isMe && isPending
                        ? 'bg-indigo-600 text-white opacity-75'
                        : isMe
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900',
                  ].join(' ')}
                >
                  {!isMe && (
                    <p className="mb-1 text-xs font-semibold text-gray-500">
                      {getFullName(message.sender.profile)}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {isMe && isFailed ? (
                    <>
                      <p className="mt-1 text-xs text-red-500">{t('messages.sendFailed')}</p>
                      <button
                        onClick={() => handleRetry(message)}
                        className="text-xs text-red-600 underline"
                      >
                        {t('messages.retry')}
                      </button>
                    </>
                  ) : isMe && isPending ? (
                    <p className="mt-1 flex items-center justify-end gap-1 text-xs text-indigo-300">
                      <Clock className="h-3 w-3" />
                      {t('messages.sending')}
                    </p>
                  ) : (
                    <p
                      className={`mt-1 text-right text-xs ${
                        isMe ? 'text-indigo-300' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={t('messages.typeMessage')}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!content.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
