import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const { user, isAuthenticated, accessToken, refreshToken, setTokens, setUser, logout } =
    useAuthStore();

  const isStudent = user?.role === 'STUDENT';
  const isTutor = user?.role === 'TUTOR';
  const isAdmin = user?.role === 'ADMIN';

  return {
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    isStudent,
    isTutor,
    isAdmin,
    setTokens,
    setUser,
    logout,
  };
}
