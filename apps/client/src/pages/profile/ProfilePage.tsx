import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Camera, User, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import { usersApi } from '@/api/users.api';
import { tutorsApi } from '@/api/tutors.api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';
import { Avatar } from '@/components/ui/Avatar';

type ProfileFormData = {
  firstName: string;
  lastName: string;
  bio?: string;
};

type TutorFormData = {
  subjects: string;
  hourlyRate: number;
  bio?: string;
};

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
  const toast = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const profileSchema = z.object({
    firstName: z.string().min(1, t('common.required')),
    lastName: z.string().min(1, t('common.required')),
    bio: z.string().optional(),
  });

  const tutorSchema = z.object({
    subjects: z.string().min(1, t('profile.subjectsRequired')),
    hourlyRate: z
      .string()
      .min(1, t('common.required'))
      .transform((value) => Number(value))
      .pipe(z.number().min(1, t('profile.hourlyRateMin'))),
    bio: z.string().optional(),
  });

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
    select: (tutors) => tutors.find((tutor) => tutor.userId === user?.id),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(t('profile.profileUpdated'));
    },
    onError: () => toast.error(t('profile.profileUpdateFailed')),
  });

  const tutorMutation = useMutation({
    mutationFn: (data: TutorFormData) => {
      const payload = {
        subjects: data.subjects
          .split(',')
          .map((subject) => subject.trim())
          .filter(Boolean),
        hourlyRate: data.hourlyRate,
        bio: data.bio,
      };
      return tutorProfile ? tutorsApi.updateProfile(payload) : tutorsApi.createProfile(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-profile-me'] });
      toast.success(t('profile.tutorProfileSaved'));
    },
    onError: () => toast.error(t('profile.tutorProfileFailed')),
  });

  const availabilityForm = useForm({
    defaultValues: { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
  });

  const availabilityMutation = useMutation({
    mutationFn: tutorsApi.createAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-profile-me'] });
      toast.success(t('profile.availabilityAdded'));
    },
    onError: () => toast.error(t('profile.availabilityFailed')),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(t('profile.avatarUpdated'));
      setPreviewUrl(null);
      setPendingFile(null);
    },
    onError: () => toast.error(t('profile.avatarFailed')),
  });

  const removeAvatarMutation = useMutation({
    mutationFn: usersApi.removeAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.info(t('profile.avatarRemoved'));
    },
    onError: () => toast.error(t('profile.avatarRemoveFailed')),
  });

  const handleTutorSubmit = (raw: { subjects: string; hourlyRate: string; bio?: string }) => {
    const result = tutorSchema.safeParse(raw);
    if (!result.success) {
      return;
    }
    tutorMutation.mutate(result.data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPreviewError(null);

    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(t('profile.imageTooLarge'));
      setPreviewError(t('profile.imageTooLarge'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.imageInvalidFormat'));
      setPreviewError(t('profile.imageInvalidFormat'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPendingFile(file);
  };

  const handleCancelPreview = () => {
    setPreviewUrl(null);
    setPendingFile(null);
    setPreviewError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentAvatarUrl = profile?.profile?.avatarUrl ?? null;
  const hasCustomAvatar =
    currentAvatarUrl !== null && !currentAvatarUrl.endsWith('default-avatar.svg');

  if (isProfileLoading || isTutorProfileLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="shimmer h-8 w-24 rounded" />
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
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
        <p className="text-sm text-red-500">{t('errors.somethingWentWrong')}</p>
      </div>
    );
  }

  const roleKey = user?.role?.toLowerCase() as 'student' | 'tutor' | 'admin' | undefined;
  const roleName = roleKey ? t(`common.role.${roleKey}`) : '';

  const avatarProfile = previewUrl
    ? { firstName: profile?.profile?.firstName, avatarUrl: previewUrl }
    : { firstName: profile?.profile?.firstName, avatarUrl: currentAvatarUrl };

  const dayOptions = [0, 1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="animate-fade-in-up mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <SectionHeader icon={User} title={t('profile.accountDetails')} />

        <div className="mb-6 flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className="group relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar profile={avatarProfile} size="lg" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={handleFileSelect}
            />

            {previewUrl && (
              <div className="flex gap-2">
                <button
                  onClick={() => pendingFile && uploadAvatarMutation.mutate(pendingFile)}
                  disabled={uploadAvatarMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploadAvatarMutation.isPending ? t('common.submitting') : t('profile.savePhoto')}
                </button>
                <button
                  onClick={handleCancelPreview}
                  disabled={uploadAvatarMutation.isPending}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}

            {!previewUrl && hasCustomAvatar && (
              <button
                onClick={() => removeAvatarMutation.mutate()}
                disabled={removeAvatarMutation.isPending}
                className="text-xs text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
              >
                {removeAvatarMutation.isPending ? t('profile.removing') : t('profile.removePhoto')}
              </button>
            )}

            {previewError && (
              <p className="text-xs text-red-500">{previewError}</p>
            )}
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('auth.firstName')}
              </label>
              <input {...profileForm.register('firstName')} className={inputClass} />
              {profileForm.formState.errors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {profileForm.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('auth.lastName')}
              </label>
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
              {t('profile.bio')}{' '}
              <span className="font-normal text-gray-400">{t('profile.bioOptional')}</span>
            </label>
            <textarea
              {...profileForm.register('bio')}
              rows={3}
              className={inputClass}
              placeholder={t('profile.bioPlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {profileMutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </form>
      </div>

      {user?.role === 'TUTOR' && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <SectionHeader
              icon={GraduationCap}
              title={tutorProfile ? t('profile.tutorProfileTitle') : t('profile.createTutorProfileTitle')}
            />

            {tutorProfile && !tutorProfile.isApproved && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t('profile.pendingApproval')}
              </div>
            )}

            <form onSubmit={tutorForm.handleSubmit(handleTutorSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('profile.subjects')}{' '}
                  <span className="font-normal text-gray-400">{t('profile.subjectsOptional')}</span>
                </label>
                <input
                  {...tutorForm.register('subjects')}
                  placeholder={t('profile.subjectsPlaceholder')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('profile.hourlyRate')}
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
                  {t('profile.bio')}{' '}
                  <span className="font-normal text-gray-400">{t('profile.bioOptional')}</span>
                </label>
                <textarea
                  {...tutorForm.register('bio')}
                  rows={3}
                  className={inputClass}
                  placeholder={t('profile.bioPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={tutorMutation.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {tutorMutation.isPending
                  ? t('profile.saving')
                  : tutorProfile
                    ? t('profile.updateButton')
                    : t('profile.createButton')}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <SectionHeader icon={Clock} title={t('profile.addAvailability')} />

            <form
              onSubmit={availabilityForm.handleSubmit((data) => availabilityMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('profile.day')}
                  </label>
                  <select
                    {...availabilityForm.register('dayOfWeek', { valueAsNumber: true })}
                    className={inputClass}
                  >
                    {dayOptions.map((dayIndex) => (
                      <option key={dayIndex} value={dayIndex}>
                        {t(`profile.days.${dayIndex}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('profile.startTime')}
                  </label>
                  <input
                    {...availabilityForm.register('startTime')}
                    type="time"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    {t('profile.endTime')}
                  </label>
                  <input
                    {...availabilityForm.register('endTime')}
                    type="time"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={availabilityMutation.isPending}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {availabilityMutation.isPending ? t('profile.adding') : t('profile.addAvailabilityButton')}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
