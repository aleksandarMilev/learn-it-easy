import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  MessageSquare,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { notificationsApi } from '@/api/notifications.api';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tutors', label: 'Tutors', icon: GraduationCap },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
] as const;

export function Navbar() {
  const { user, refreshToken, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

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

  const isActive = (to: string) =>
    to === '/dashboard'
      ? location.pathname === to
      : location.pathname.startsWith(to);

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xl font-bold text-indigo-600"
            >
              <GraduationCap className="h-6 w-6" />
              <span>LearnItEasy</span>
            </Link>

            {isAuthenticated && (
              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                      isActive(to)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}

                <Link
                  to="/notifications"
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    location.pathname === '/notifications'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                  {unreadCount && unreadCount.count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </span>
                  )}
                </Link>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {user?.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="hidden max-w-40 truncate sm:block">{user?.email}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
