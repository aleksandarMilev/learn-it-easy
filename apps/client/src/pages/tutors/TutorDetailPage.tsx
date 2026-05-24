import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tutorsApi } from '@/api/tutors.api';
import { bookingsApi } from '@/api/bookings.api';
import { getFullName, getDayName } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  subject: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: tutor, isLoading } = useQuery({
    queryKey: ['tutors', id],
    queryFn: () => tutorsApi.getById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => bookingsApi.create({ tutorId: id!, ...data }),
    onSuccess: () => navigate('/bookings'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!tutor) {
    return <div className="py-24 text-center text-gray-500">Tutor not found</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600">
            {tutor.user.profile?.firstName?.[0] ?? '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{getFullName(tutor.user.profile)}</h1>
            <p className="mt-1 text-xl font-semibold text-indigo-600">${tutor.hourlyRate}/hr</p>
            {tutor.bio && <p className="mt-3 text-gray-600">{tutor.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.subjects.map((subject) => (
                <span
                  key={subject}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>

        {tutor.availability.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="font-semibold text-gray-900">Availability</h2>
            <div className="mt-3 space-y-2">
              {tutor.availability.map((a) => (
                <div key={a.id} className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="w-24 font-medium">{getDayName(a.dayOfWeek)}</span>
                  <span>
                    {a.startTime} – {a.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {user?.role === 'STUDENT' && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Book a session</h2>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start time</label>
                <input
                  {...register('startTime')}
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">End time</label>
                <input
                  {...register('endTime')}
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
              <select
                {...register('subject')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select a subject</option>
                {tutor.subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="What would you like to focus on?"
              />
            </div>
            {mutation.isError && (
              <p className="text-sm text-red-500">Failed to create booking. Check the time slot.</p>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Booking...' : 'Book session'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
