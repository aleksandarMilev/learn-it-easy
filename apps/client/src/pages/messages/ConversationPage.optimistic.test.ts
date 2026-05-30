import { describe, it, expect } from 'vitest';
import {
  addOptimisticMessage,
  confirmOptimisticMessage,
  failOptimisticMessage,
  retryOptimisticMessage,
} from './optimistic.utils';
import type { OptimisticMessage } from '@/types';

function makePendingMessage(overrides: Partial<OptimisticMessage> = {}): OptimisticMessage {
  return {
    id: 'optimistic-nonce-abc',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: 'Hello',
    createdAt: new Date().toISOString(),
    status: 'pending',
    nonce: 'abc',
    sender: { id: 'user-1', profile: null },
    ...overrides,
  };
}

describe('optimistic message lifecycle', () => {
  it('adds a pending message immediately on send', () => {
    const nonce = 'test-nonce';
    const message = makePendingMessage({ nonce, status: 'pending' });

    const result = addOptimisticMessage([], message);
    const [firstMessage] = result;

    expect(result).toHaveLength(1);
    expect(firstMessage?.status).toBe('pending');
    expect(firstMessage?.nonce).toBe(nonce);
  });

  it('removes the optimistic entry when server confirms with matching nonce', () => {
    const pending = makePendingMessage({ nonce: 'abc' });
    const incomingMessage = {
      id: 'real-id',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      createdAt: new Date().toISOString(),
      sender: { id: 'user-1', profile: null },
      nonce: 'abc',
    };

    const result = confirmOptimisticMessage([pending], incomingMessage);

    expect(result).toHaveLength(0);
  });

  it('falls back to content+timestamp matching when nonce is absent', () => {
    const now = new Date().toISOString();
    const pending = makePendingMessage({
      content: 'Hello',
      senderId: 'user-1',
      createdAt: now,
      nonce: 'abc',
    });
    const incomingMessage = {
      id: 'real-id',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'Hello',
      createdAt: now,
      sender: { id: 'user-1', profile: null },
    };

    const result = confirmOptimisticMessage([pending], incomingMessage);

    expect(result).toHaveLength(0);
  });

  it('marks message as failed after timeout', () => {
    const pending = makePendingMessage({ nonce: 'abc', status: 'pending' });

    const result = failOptimisticMessage([pending], 'abc');
    const [firstMessage] = result;

    expect(firstMessage?.status).toBe('failed');
  });

  it('updates nonce and resets to pending on retry', () => {
    const failed = makePendingMessage({ nonce: 'old-nonce', status: 'failed' });

    const result = retryOptimisticMessage([failed], 'old-nonce', 'new-nonce');
    const [firstMessage] = result;

    expect(firstMessage?.status).toBe('pending');
    expect(firstMessage?.nonce).toBe('new-nonce');
  });
});
