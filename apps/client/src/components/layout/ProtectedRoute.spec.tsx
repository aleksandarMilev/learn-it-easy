import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, GuestRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';

vi.mock('@/store/auth.store');

type AuthState = {
  isAuthenticated: boolean;
  user: { id: string; email: string; role: 'STUDENT' | 'TUTOR' | 'ADMIN' } | null;
};

function setupAuthState(state: AuthState) {
  vi.mocked(useAuthStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (selector: (s: any) => any) => selector(state),
  );
}

function renderWithRouter(initialPath: string, element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/admin" element={element} />
        <Route path="/protected" element={element} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect an unauthenticated user to /login', () => {
    setupAuthState({ isAuthenticated: false, user: null });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  it('should render children for an authenticated user', () => {
    setupAuthState({
      isAuthenticated: true,
      user: { id: '1', email: 'student@test.com', role: 'STUDENT' },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect an unauthenticated user to /login', () => {
    setupAuthState({ isAuthenticated: false, user: null });

    renderWithRouter(
      '/admin',
      <AdminRoute>
        <div>Admin Page</div>
      </AdminRoute>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
  });

  it('should redirect a non-admin authenticated user to /dashboard', () => {
    setupAuthState({
      isAuthenticated: true,
      user: { id: '1', email: 'student@test.com', role: 'STUDENT' },
    });

    renderWithRouter(
      '/admin',
      <AdminRoute>
        <div>Admin Page</div>
      </AdminRoute>,
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
  });

  it('should render the admin page for a user with ADMIN role', () => {
    setupAuthState({
      isAuthenticated: true,
      user: { id: '1', email: 'admin@test.com', role: 'ADMIN' },
    });

    renderWithRouter(
      '/admin',
      <AdminRoute>
        <div>Admin Page</div>
      </AdminRoute>,
    );

    expect(screen.getByText('Admin Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children for a guest (unauthenticated) user', () => {
    setupAuthState({ isAuthenticated: false, user: null });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>Login Page</div>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should redirect an already-authenticated user to /dashboard', () => {
    setupAuthState({
      isAuthenticated: true,
      user: { id: '1', email: 'user@test.com', role: 'STUDENT' },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>Login Page</div>
              </GuestRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
