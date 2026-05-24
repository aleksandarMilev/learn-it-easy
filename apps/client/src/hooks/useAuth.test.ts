import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from './useAuth';
import { renderHook } from '@testing-library/react';

describe('useAuth', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('should return false for all role checks when not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isStudent).toBe(false);
    expect(result.current.isTutor).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return isStudent true for STUDENT role', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'test@test.com', role: 'STUDENT' });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isStudent).toBe(true);
    expect(result.current.isTutor).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it('should return isTutor true for TUTOR role', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'test@test.com', role: 'TUTOR' });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isTutor).toBe(true);
    expect(result.current.isStudent).toBe(false);
  });

  it('should return isAdmin true for ADMIN role', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'test@test.com', role: 'ADMIN' });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAdmin).toBe(true);
  });

  it('should expose logout function', () => {
    useAuthStore.getState().setTokens('token', 'refresh');

    const { result } = renderHook(() => useAuth());

    result.current.logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
