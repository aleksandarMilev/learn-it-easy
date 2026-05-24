import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { notificationsApi } from '@/api/notifications.api';

export function Navbar() {
  const { user, refreshToken, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => {});
    }
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
              LearnItEasy
            </Link>
            {isAuthenticated && (
              <div className="hidden items-center gap-6 md:flex">
                <Link to="/tutors" className="text-sm text-gray-600 hover:text-indigo-600">
                  Tutors
                </Link>
                <Link to="/bookings" className="text-sm text-gray-600 hover:text-indigo-600">
                  Bookings
                </Link>
                <Link to="/messages" className="text-sm text-gray-600 hover:text-indigo-600">
                  Messages
                </Link>
                <Link
                  to="/notifications"
                  className="relative text-sm text-gray-600 hover:text-indigo-600"
                >
                  Notifications
                  {unreadCount && unreadCount.count > 0 && (
                    <span className="absolute -top-2 -right-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="text-sm text-gray-600 hover:text-indigo-600">
                {user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
