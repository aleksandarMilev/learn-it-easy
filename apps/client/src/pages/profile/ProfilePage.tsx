import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/api/users.api';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      firstName: profile?.profile?.firstName ?? '',
      lastName: profile?.profile?.lastName ?? '',
      bio: profile?.profile?.bio ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
            {profile?.profile?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role.toLowerCase()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
              <input
                {...register('firstName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
              <input
                {...register('lastName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              {...register('bio')}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          {mutation.isSuccess && (
            <p className="text-sm text-green-600">Profile updated successfully!</p>
          )}
          {mutation.isError && <p className="text-sm text-red-500">Failed to update profile.</p>}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
