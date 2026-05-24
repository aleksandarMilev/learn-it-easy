import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { ArrowLeft, SendHorizonal } from 'lucide-react';
import { messagingApi } from '@/api/messaging.api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import { getFullName, formatTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Message } from '@/types';

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const addToast = useToastStore((s) => s.addToast);
  const socket = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState('');
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);

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
    () => [...(messages ?? []), ...extraMessages],
    [messages, extraMessages],
  );

  useEffect(() => {
    if (!socket || !id) {
      return;
    }

    socket.emit('joinConversation', id);

    socket.on('receiveMessage', (message: Message) => {
      setExtraMessages((prev) => [...prev, message]);
    });

    socket.on('connect_error', () => {
      addToast('Connection lost. Trying to reconnect...', 'error');
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('connect_error');
    };
  }, [socket, id, addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSend = () => {
    if (!content.trim() || !socket) {
      return;
    }

    socket.emit('sendMessage', { conversationId: id, content });
    setContent('');
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
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
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
        Back to messages
      </Link>

      <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {allMessages.map((message) => {
            const isMe = message.senderId === user?.id;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && <Avatar profile={message.sender.profile} size="sm" />}
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2.5 shadow-sm lg:max-w-sm ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isMe && (
                    <p className="mb-1 text-xs font-semibold text-gray-500">
                      {getFullName(message.sender.profile)}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`mt-1 text-right text-xs ${
                      isMe ? 'text-indigo-300' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
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
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Type a message… (Enter to send)"
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
