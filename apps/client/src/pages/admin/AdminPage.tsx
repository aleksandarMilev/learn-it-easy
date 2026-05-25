import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Shield, Users, CalendarDays, GraduationCap, ArrowRight } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { tutorsApi } from '@/api/tutors.api';

export function AdminPage() {
  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
  });

  const { data: bookings } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: adminApi.getAllBookings,
  });

  const { data: tutors } = useQuery({
    queryKey: ['tutors'],
    queryFn: tutorsApi.getAll,
  });

  const pendingApprovalCount = tutors?.filter((tutor) => !tutor.isApproved).length ?? 0;

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-amber-600 font-medium">Elevated permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Users className="h-6 w-6 text-indigo-600" />}
          label="Total Users"
          value={users?.length ?? '—'}
          href="/admin/users"
          bgClass="bg-indigo-50"
        />
        <StatCard
          icon={<CalendarDays className="h-6 w-6 text-indigo-600" />}
          label="Total Bookings"
          value={bookings?.length ?? '—'}
          href="/admin/bookings"
          bgClass="bg-indigo-50"
        />
        <StatCard
          icon={<GraduationCap className="h-6 w-6 text-amber-600" />}
          label="Pending Approvals"
          value={pendingApprovalCount}
          href="/admin/tutors"
          bgClass="bg-amber-50"
          highlight={pendingApprovalCount > 0}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Quick access</h2>
        <div className="mt-4 space-y-2">
          <AdminLink to="/admin/users" label="Manage Users" />
          <AdminLink to="/admin/tutors" label="Manage Tutors" />
          <AdminLink to="/admin/bookings" label="View All Bookings" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string;
  bgClass: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, href, bgClass, highlight }: StatCardProps) {
  return (
    <Link
      to={href}
      className={`group rounded-xl border bg-white p-6 shadow-sm transition-all duration-150 hover:shadow-md ${
        highlight ? 'border-amber-300' : 'border-gray-200 hover:border-indigo-200'
      }`}
    >
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${bgClass}`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
        View <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

function AdminLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-indigo-600"
    >
      {label}
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}
