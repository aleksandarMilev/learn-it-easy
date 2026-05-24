import { User } from 'lucide-react';

interface AvatarProps {
  profile: { firstName?: string | null; avatarUrl?: string | null } | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
};

export function Avatar({ profile, size = 'md' }: AvatarProps) {
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 ${sizeClass}`}
    >
      {profile?.avatarUrl ? (
        <img
          src={`http://localhost:3000${profile.avatarUrl}`}
          className="h-full w-full rounded-full object-cover"
          alt="Avatar"
        />
      ) : profile?.firstName ? (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
          {profile.firstName[0]?.toUpperCase()}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-300 text-gray-500">
          <User className="h-1/2 w-1/2" />
        </div>
      )}
    </div>
  );
}
