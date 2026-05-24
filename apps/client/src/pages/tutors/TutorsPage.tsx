import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tutorsApi } from '@/api/tutors.api';
import { getFullName, getDayName } from '@/lib/utils';

export function TutorsPage() {
  const { data: tutors, isLoading } = useQuery({
    queryKey: ['tutors'],
    queryFn: tutorsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a tutor</h1>
        <p className="mt-1 text-sm text-gray-500">Browse our approved tutors and book a session.</p>
      </div>

      {tutors?.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-24 text-center shadow-sm">
          <p className="text-gray-500">No tutors available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tutors?.map((tutor) => (
            <Link
              key={tutor.id}
              to={`/tutors/${tutor.id}`}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{getFullName(tutor.user.profile)}</h2>
                  <p className="mt-1 text-2xl font-bold text-indigo-600">
                    ${tutor.hourlyRate}
                    <span className="text-sm font-normal text-gray-500">/hr</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                  {tutor.user.profile?.firstName?.[0] ?? '?'}
                </div>
              </div>

              {tutor.bio && <p className="mt-3 line-clamp-2 text-sm text-gray-600">{tutor.bio}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                  >
                    {subject}
                  </span>
                ))}
              </div>

              {tutor.availability.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500">Available:</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tutor.availability.map((a) => (
                      <span key={a.id} className="text-xs text-gray-600">
                        {getDayName(a.dayOfWeek)} {a.startTime}–{a.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
