import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { messagingApi } from '@/api/messaging.api';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth.store';
import { getFullName, formatTime } from '@/lib/utils';
import type { Message } from '@/types';

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const socket = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState('');
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);

  const { data: messages, isLoading, isError } = useQuery({
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

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket, id]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-t-xl border border-b-0 border-gray-200 bg-white p-6">
        {allMessages.map((message) => {
          const isMe = message.senderId === user?.id;
          return (
            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 ${
                  isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {!isMe && (
                  <p className="mb-1 text-xs font-medium text-gray-500">
                    {getFullName(message.sender.profile)}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
                <p className={`mt-1 text-xs ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="rounded-b-xl border border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message... (Enter to send)"
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!content.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
