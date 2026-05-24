import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { useAuthStore } from '@/store/auth.store';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useSocket', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  it('should return null when not authenticated', () => {
    const { result } = renderHook(() => useSocket());
    expect(result.current).toBeNull();
  });

  it('should create socket when access token is present', async () => {
    const { io } = await import('socket.io-client');
    const { rerender } = renderHook(() => useSocket());

    act(() => {
      useAuthStore.getState().setTokens('test-token', 'refresh-token');
    });

    rerender();

    expect(io).toHaveBeenCalledWith('http://localhost:3000', {
      auth: { token: 'test-token' },
      transports: ['websocket'],
    });

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  it('should disconnect socket on unmount', async () => {
    act(() => {
      useAuthStore.getState().setTokens('test-token', 'refresh-token');
    });

    const { unmount } = renderHook(() => useSocket());
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
