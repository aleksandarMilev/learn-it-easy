import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, MessageSquare, CalendarDays, Star } from 'lucide-react';
import { tutorsApi } from '@/api/tutors.api';
import { bookingsApi } from '@/api/bookings.api';
import { messagingApi } from '@/api/messaging.api';
import { reviewsApi } from '@/api/reviews.api';
import { formatDate, getFullName, getDayName } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/store/toast.store';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';

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

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.getByTutor(id!),
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

  const reviewCount = reviews?.length ?? 0;
  const averageRating =
    reviewCount > 0
      ? reviews!.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;

  return (
    <div className="animate-fade-in-up mx-auto max-w-5xl space-y-8">
      <div className="lg:flex lg:items-start lg:gap-8">
        {/* Left: Tutor info */}
        <div className="flex-1 space-y-6">
          {/* Hero card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-br from-indigo-500 to-indigo-700" />
            <div className="px-8 pb-8">
              <div className="-mt-10 mb-4 ring-4 ring-white rounded-full w-fit shadow-sm">
                <Avatar profile={tutor.user.profile} size="lg" />
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
                {tutor.availability.map((availabilitySlot) => (
                  <div key={availabilitySlot.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {getDayName(availabilitySlot.dayOfWeek)}
                    </span>
                    <span className="rounded-lg bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
                      {availabilitySlot.startTime} – {availabilitySlot.endTime}
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
                        {tutor.subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
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

      {/* Reviews section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Reviews</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            {reviewCount}
          </span>
        </div>

        {reviewCount === 0 ? (
          <div className="mt-6 flex flex-col items-center py-8 text-center">
            <Star className="mb-2 h-8 w-8 text-gray-200" />
            <p className="text-sm text-gray-500">No reviews yet</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3">
              <StarRating value={Math.round(averageRating)} size="lg" />
              <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
            </div>

            <div className="mt-6 space-y-4 divide-y divide-gray-100">
              {reviews!.map((review) => (
                <div key={review.id} className="pt-4 first:pt-0">
                  <StarRating value={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
