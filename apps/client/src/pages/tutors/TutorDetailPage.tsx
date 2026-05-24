import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, MessageSquare, CalendarDays } from 'lucide-react';
import { tutorsApi } from '@/api/tutors.api';
import { bookingsApi } from '@/api/bookings.api';
import { messagingApi } from '@/api/messaging.api';
import { getFullName, getDayName } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';

const schema = z.object({
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  subject: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

export function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toast = useToast();

  const {
    data: tutor,
    isLoading,
    isError,
  } = useQuery({
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

  const bookingMutation = useMutation({
    mutationFn: (data: FormData) => bookingsApi.create({ tutorId: id!, ...data }),
    onSuccess: () => {
      toast.success('Session booked successfully!');
      navigate('/bookings');
    },
    onError: () => toast.error('Failed to book session. Please try again.'),
  });

  const messageMutation = useMutation({
    mutationFn: () => messagingApi.createConversation(tutor!.user.id),
    onSuccess: (conversation) => navigate(`/messages/${conversation.id}`),
    onError: () => toast.error('Failed to open conversation. Please try again.'),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="lg:flex lg:gap-8">
          <div className="flex-1 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="shimmer h-32 w-full" />
              <div className="space-y-3 p-8">
                <div className="shimmer h-6 w-48 rounded" />
                <div className="shimmer h-5 w-24 rounded" />
                <div className="shimmer h-4 w-full rounded" />
                <div className="shimmer h-4 w-3/4 rounded" />
              </div>
            </div>
          </div>
          <div className="mt-6 w-full lg:mt-0 lg:w-80 lg:shrink-0">
            <div className="shimmer h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      </div>
    );
  }

  if (!tutor) {
    return <div className="py-24 text-center text-gray-500">Tutor not found</div>;
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl">
      <div className="lg:flex lg:items-start lg:gap-8">
        {/* Left: Tutor info */}
        <div className="flex-1 space-y-6">
          {/* Hero card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-br from-indigo-500 to-indigo-700" />
            <div className="px-8 pb-8">
              <div className="-mt-10 mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-3xl font-bold text-indigo-600 shadow-sm">
                  {tutor.user.profile?.firstName?.[0] ?? '?'}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getFullName(tutor.user.profile)}
              </h1>
              <p className="mt-1 text-lg font-semibold text-indigo-600">${tutor.hourlyRate}/hr</p>
              {tutor.bio && <p className="mt-3 leading-relaxed text-gray-600">{tutor.bio}</p>}
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

          {/* Availability */}
          {tutor.availability.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Availability</h2>
              </div>
              <div className="mt-4 space-y-2">
                {tutor.availability.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {getDayName(a.dayOfWeek)}
                    </span>
                    <span className="rounded-lg bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
                      {a.startTime} – {a.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions (sticky on desktop) */}
        {isAuthenticated && user?.role === 'STUDENT' && (
          <div className="mt-6 w-full lg:mt-0 lg:w-80 lg:shrink-0">
            <div className="space-y-4 lg:sticky lg:top-8">
              {/* Contact */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900">Contact tutor</h2>
                <p className="mt-1 text-sm text-gray-500">Start a conversation before booking.</p>
                <button
                  onClick={() => messageMutation.mutate()}
                  disabled={messageMutation.isPending}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50 disabled:opacity-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  {messageMutation.isPending ? 'Opening chat...' : 'Send a message'}
                </button>
              </div>

              {/* Booking form */}
              {user?.role === 'STUDENT' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Book a session</h2>
                  </div>
                  <form
                    onSubmit={handleSubmit((data) => bookingMutation.mutate(data))}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Start time
                      </label>
                      <input
                        {...register('startTime')}
                        type="datetime-local"
                        className={inputClass}
                      />
                      {errors.startTime && (
                        <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        End time
                      </label>
                      <input
                        {...register('endTime')}
                        type="datetime-local"
                        className={inputClass}
                      />
                      {errors.endTime && (
                        <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <select {...register('subject')} className={inputClass}>
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
                        Notes <span className="font-normal text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        className={inputClass}
                        placeholder="What would you like to focus on?"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={bookingMutation.isPending}
                      className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                    >
                      {bookingMutation.isPending ? 'Booking...' : 'Book session'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
