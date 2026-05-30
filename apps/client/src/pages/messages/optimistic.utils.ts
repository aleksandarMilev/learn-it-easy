import type { Message, MessageStatus, OptimisticMessage } from '@/types';

export function generateNonce(): string {
  return `nonce-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function addOptimisticMessage(
  previous: OptimisticMessage[],
  message: OptimisticMessage,
): OptimisticMessage[] {
  return [...previous, message];
}

export function confirmOptimisticMessage(
  previous: OptimisticMessage[],
  incomingMessage: Message & { nonce?: string },
): OptimisticMessage[] {
  const matchIndex = incomingMessage.nonce
    ? previous.findIndex((optimistic) => optimistic.nonce === incomingMessage.nonce)
    : previous.findIndex(
        (optimistic) =>
          optimistic.status === 'pending' &&
          optimistic.content === incomingMessage.content &&
          optimistic.senderId === incomingMessage.senderId &&
          Math.abs(
            new Date(optimistic.createdAt).getTime() -
              new Date(incomingMessage.createdAt).getTime(),
          ) < 10_000,
      );

  if (matchIndex === -1) {
    return previous;
  }

  return previous.filter((_, index) => index !== matchIndex);
}

export function failOptimisticMessage(
  previous: OptimisticMessage[],
  nonce: string,
): OptimisticMessage[] {
  return previous.map((message) =>
    message.nonce === nonce ? { ...message, status: 'failed' as MessageStatus } : message,
  );
}

export function retryOptimisticMessage(
  previous: OptimisticMessage[],
  oldNonce: string,
  newNonce: string,
): OptimisticMessage[] {
  return previous.map((message) =>
    message.nonce === oldNonce
      ? { ...message, status: 'pending' as MessageStatus, nonce: newNonce }
      : message,
  );
}
