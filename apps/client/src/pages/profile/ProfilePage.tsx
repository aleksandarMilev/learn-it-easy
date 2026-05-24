import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/api/users.api';
import { tutorsApi } from '@/api/tutors.api';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  bio: z.string().optional(),
});

const tutorSchema = z.object({
  subjects: z.string().min(1, 'At least one subject required'),
  hourlyRate: z
    .string()
    .min(1, 'Required')
    .transform((v) => Number(v))
    .pipe(z.number().min(1, 'Must be at least 1')),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type TutorFormData = z.infer<typeof tutorSchema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
  });

  const {
    data: tutorProfile,
    isLoading: isTutorProfileLoading,
    isError: isTutorProfileError,
  } = useQuery({
    queryKey: ['tutor-profile-me'],
    queryFn: tutorsApi.getAll,
    enabled: user?.role === 'TUTOR',
    select: (tutors) => tutors.find((t) => t.userId === user?.id),
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.profile?.firstName ?? '',
      lastName: profile?.profile?.lastName ?? '',
      bio: profile?.profile?.bio ?? '',
    },
  });

  const tutorForm = useForm<{ subjects: string; hourlyRate: string; bio?: string }>({
    defaultValues: {
      subjects: '',
      hourlyRate: '',
      bio: '',
    },
    values: {
      subjects: tutorProfile?.subjects.join(', ') ?? '',
      hourlyRate: tutorProfile?.hourlyRate?.toString() ?? '',
      bio: tutorProfile?.bio ?? '',
    },
  });

  const profileMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const tutorMutation = useMutation({
    mutationFn: (data: TutorFormData) => {
      const payload = {
        subjects: data.subjects
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        hourlyRate: data.hourlyRate,
        bio: data.bio,
      };

      return tutorProfile ? tutorsApi.updateProfile(payload) : tutorsApi.createProfile(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutor-profile-me'] }),
  });

  const availabilityForm = useForm({
    defaultValues: { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
  });

  const availabilityMutation = useMutation({
    mutationFn: tutorsApi.createAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tutor-profile-me'] }),
  });

  const handleTutorSubmit = (raw: { subjects: string; hourlyRate: string; bio?: string }) => {
    const result = tutorSchema.safeParse(raw);
    if (!result.success) return;
    tutorMutation.mutate(result.data);
  };

  if (isProfileLoading || isTutorProfileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (isProfileError || isTutorProfileError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      </div>
    );
  }

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

        <form
          onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">First name</label>
              <input
                {...profileForm.register('firstName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {profileForm.formState.errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {profileForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Last name</label>
              <input
                {...profileForm.register('lastName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {profileForm.formState.errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {profileForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              {...profileForm.register('bio')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {profileMutation.isSuccess && <p className="text-sm text-green-600">Profile updated!</p>}
          {profileMutation.isError && (
            <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
          )}
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {profileMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {user?.role === 'TUTOR' && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              {tutorProfile ? 'Update tutor profile' : 'Create tutor profile'}
            </h2>
            {tutorProfile && !tutorProfile.isApproved && (
              <div className="mb-4 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                Your profile is pending admin approval.
              </div>
            )}
            <form onSubmit={tutorForm.handleSubmit(handleTutorSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Subjects (comma separated)
                </label>
                <input
                  {...tutorForm.register('subjects')}
                  placeholder="Mathematics, Physics, Chemistry"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hourly rate ($)
                </label>
                <input
                  {...tutorForm.register('hourlyRate')}
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  {...tutorForm.register('bio')}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {tutorMutation.isSuccess && (
                <p className="text-sm text-green-600">Tutor profile saved!</p>
              )}
              {tutorMutation.isError && (
                <p className="text-sm text-red-500">Failed to save tutor profile.</p>
              )}
              <button
                type="submit"
                disabled={tutorMutation.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {tutorMutation.isPending ? 'Saving...' : tutorProfile ? 'Update' : 'Create profile'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Add availability</h2>
            <form
              onSubmit={availabilityForm.handleSubmit((data) => availabilityMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Day</label>
                  <select
                    {...availabilityForm.register('dayOfWeek', { valueAsNumber: true })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {[
                      'Sunday',
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                    ].map((day, i) => (
                      <option key={day} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start</label>
                  <input
                    {...availabilityForm.register('startTime')}
                    type="time"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">End</label>
                  <input
                    {...availabilityForm.register('endTime')}
                    type="time"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              {availabilityMutation.isSuccess && (
                <p className="text-sm text-green-600">Availability added!</p>
              )}
              {availabilityMutation.isError && (
                <p className="text-sm text-red-500">Already have availability for this day.</p>
              )}
              <button
                type="submit"
                disabled={availabilityMutation.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {availabilityMutation.isPending ? 'Adding...' : 'Add availability'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
