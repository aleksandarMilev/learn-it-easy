import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, ArrowRight } from 'lucide-react';
import { tutorsApi } from '@/api/tutors.api';
import { getFullName, getDayName } from '@/lib/utils';

function TutorCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="shimmer h-4 w-32 rounded" />
          <div className="shimmer h-6 w-20 rounded" />
        </div>
        <div className="shimmer h-12 w-12 rounded-full" />
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-4/5 rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="shimmer h-6 w-16 rounded-full" />
        <div className="shimmer h-6 w-20 rounded-full" />
        <div className="shimmer h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function TutorsPage() {
  const { data: tutors, isLoading, isError } = useQuery({
    queryKey: ['tutors'],
    queryFn: tutorsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find a tutor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse our approved tutors and book a session.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TutorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a tutor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse our approved tutors and book a session.
        </p>
      </div>

      {tutors?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <GraduationCap className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900">No tutors available yet</h3>
          <p className="mt-1 text-sm text-gray-500">Check back soon as more tutors join.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutors?.map((tutor) => (
            <Link
              key={tutor.id}
              to={`/tutors/${tutor.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-150 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {getFullName(tutor.user.profile)}
                  </h2>
                  <p className="mt-1 text-xl font-bold text-indigo-600">
                    ${tutor.hourlyRate}
                    <span className="text-sm font-normal text-gray-400">/hr</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                  {tutor.user.profile?.firstName?.[0] ?? '?'}
                </div>
              </div>

              {tutor.bio && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-500">{tutor.bio}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {tutor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {subject}
                  </span>
                ))}
              </div>

              {tutor.availability.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    Available:
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tutor.availability.map((a) => (
                      <span key={a.id} className="text-xs text-gray-500">
                        {getDayName(a.dayOfWeek)} {a.startTime}–{a.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                View profile
                <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
