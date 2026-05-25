import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users, Search } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { formatDate, getFullName } from '@/lib/utils';
import type { Role } from '@/types';

const roleBadgeClasses: Record<Role, string> = {
  STUDENT: 'bg-blue-100 text-blue-700',
  TUTOR: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-amber-100 text-amber-700',
};

export function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
  });

  const filteredUsers = users?.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-8 w-48 rounded" />
        <div className="shimmer h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="shimmer h-14 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-red-500">{t('errors.somethingWentWrong')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">
          {t('admin.users')}{' '}
          <span className="text-lg font-normal text-gray-400">({users?.length ?? 0})</span>
        </h1>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('admin.searchUsers')}
          className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-9 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden grid-cols-4 border-b border-gray-100 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
          <span>{t('auth.email')}</span>
          <span>{t('dashboard.role')}</span>
          <span>{t('auth.signIn')}</span>
          <span>{t('auth.firstName')}</span>
        </div>

        {filteredUsers?.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">{t('admin.noUsersMatch')}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers?.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-1 gap-2 px-6 py-4 text-sm sm:grid-cols-4 sm:items-center sm:gap-4"
              >
                <span className="font-medium text-gray-900 truncate">{user.email}</span>
                <span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClasses[user.role]}`}
                  >
                    {t(`common.role.${user.role.toLowerCase()}`)}
                  </span>
                </span>
                <span className="text-gray-500">{formatDate(user.createdAt)}</span>
                <span className="text-gray-700">{getFullName(user.profile)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
