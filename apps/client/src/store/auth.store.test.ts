import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with empty state', () => {
    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set tokens and mark as authenticated', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');

    const state = useAuthStore.getState();

    expect(state.accessToken).toBe('access-token');
    expect(state.refreshToken).toBe('refresh-token');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should set user', () => {
    const user = { id: '1', email: 'test@test.com', role: 'STUDENT' as const };

    useAuthStore.getState().setUser(user);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('should clear state on logout', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    useAuthStore.getState().setUser({ id: '1', email: 'test@test.com', role: 'STUDENT' });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
