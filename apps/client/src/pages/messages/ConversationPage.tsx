import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
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
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const { data: messages } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => messagingApi.getMessages(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (messages) setLocalMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!socket || !id) {
      return;
    }

    socket.emit('joinConversation', id);
    socket.on('receiveMessage', (message: Message) => {
      setLocalMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

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

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto rounded-t-xl border border-b-0 border-gray-200 bg-white p-6">
        {localMessages.map((message) => {
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
