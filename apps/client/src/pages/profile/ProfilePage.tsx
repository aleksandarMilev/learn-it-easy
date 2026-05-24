import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, GraduationCap, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
      <Icon className="h-5 w-5 text-gray-400" />
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

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
    defaultValues: { subjects: '', hourlyRate: '', bio: '' },
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
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="shimmer h-8 w-24 rounded" />
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="shimmer h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <div className="shimmer h-4 w-40 rounded" />
              <div className="shimmer h-3 w-20 rounded" />
            </div>
          </div>
          <div className="shimmer h-10 w-full rounded-lg" />
          <div className="shimmer h-10 w-full rounded-lg" />
        </div>
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

  const initials =
    profile?.profile?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '?';

  const roleName = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : '';

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      {/* User profile section */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <SectionHeader icon={User} title="Account details" />

        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 ring-2 ring-white">
              <Camera className="h-3 w-3 text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {roleName}
            </span>
          </div>
        </div>

        <form
          onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">First name</label>
              <input {...profileForm.register('firstName')} className={inputClass} />
              {profileForm.formState.errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {profileForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Last name</label>
              <input {...profileForm.register('lastName')} className={inputClass} />
              {profileForm.formState.errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {profileForm.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Bio{' '}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              {...profileForm.register('bio')}
              rows={3}
              className={inputClass}
              placeholder="Tell students a bit about yourself…"
            />
          </div>

          {profileMutation.isSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Profile updated!
            </div>
          )}
          {profileMutation.isError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              Something went wrong. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {profileMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Tutor sections */}
      {user?.role === 'TUTOR' && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <SectionHeader
              icon={GraduationCap}
              title={tutorProfile ? 'Tutor profile' : 'Create tutor profile'}
            />

            {tutorProfile && !tutorProfile.isApproved && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Your profile is pending admin approval.
              </div>
            )}

            <form onSubmit={tutorForm.handleSubmit(handleTutorSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subjects{' '}
                  <span className="font-normal text-gray-400">(comma separated)</span>
                </label>
                <input
                  {...tutorForm.register('subjects')}
                  placeholder="Mathematics, Physics, Chemistry"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Hourly rate ($)
                </label>
                <input
                  {...tutorForm.register('hourlyRate')}
                  type="number"
                  min={1}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Bio{' '}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...tutorForm.register('bio')}
                  rows={3}
                  className={inputClass}
                  placeholder="Tell students about your teaching style and experience…"
                />
              </div>

              {tutorMutation.isSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Tutor profile saved!
                </div>
              )}
              {tutorMutation.isError && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  Failed to save tutor profile.
                </div>
              )}

              <button
                type="submit"
                disabled={tutorMutation.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {tutorMutation.isPending
                  ? 'Saving…'
                  : tutorProfile
                    ? 'Update profile'
                    : 'Create profile'}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <SectionHeader icon={Clock} title="Add availability" />

            <form
              onSubmit={availabilityForm.handleSubmit((data) => availabilityMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Day</label>
                  <select
                    {...availabilityForm.register('dayOfWeek', { valueAsNumber: true })}
                    className={inputClass}
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                      (day, i) => (
                        <option key={day} value={i}>
                          {day}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Start</label>
                  <input
                    {...availabilityForm.register('startTime')}
                    type="time"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">End</label>
                  <input
                    {...availabilityForm.register('endTime')}
                    type="time"
                    className={inputClass}
                  />
                </div>
              </div>

              {availabilityMutation.isSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Availability added!
                </div>
              )}
              {availabilityMutation.isError && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  Already have availability for this day.
                </div>
              )}

              <button
                type="submit"
                disabled={availabilityMutation.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {availabilityMutation.isPending ? 'Adding…' : 'Add availability'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
