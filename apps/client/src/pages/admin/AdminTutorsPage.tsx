import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, CheckCircle, Trash2 } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { tutorsApi } from '@/api/tutors.api';
import { getFullName } from '@/lib/utils';
import { useToast } from '@/store/toast.store';
import type { TutorProfile } from '@/types';

export function AdminTutorsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: tutors, isLoading, isError } = useQuery({
    queryKey: ['tutors'],
    queryFn: tutorsApi.getAll,
  });

  const approveMutation = useMutation({
    mutationFn: (tutorId: string) => adminApi.approveTutor(tutorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutors'] });
      toast.success('Tutor approved!');
    },
    onError: () => toast.error('Failed to approve tutor'),
  });

  const deleteMutation = useMutation({
    mutationFn: (tutorId: string) => adminApi.deleteTutor(tutorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutors'] });
      toast.success('Tutor removed');
    },
    onError: () => toast.error('Failed to remove tutor'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="shimmer h-8 w-48 rounded" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="shimmer h-28 rounded-xl" />
          ))}
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

  const pendingTutors = tutors?.filter((tutor) => !tutor.isApproved) ?? [];
  const approvedTutors = tutors?.filter((tutor) => tutor.isApproved) ?? [];

  return (
    <div className="animate-fade-in-up space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">Tutors</h1>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
          {pendingTutors.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              {pendingTutors.length}
            </span>
          )}
        </div>

        {pendingTutors.length === 0 ? (
          <p className="text-sm text-gray-500">No tutors pending approval.</p>
        ) : (
          <div className="space-y-3">
            {pendingTutors.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                actions={
                  <button
                    onClick={() => approveMutation.mutate(tutor.id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Approved Tutors</h2>

        {approvedTutors.length === 0 ? (
          <p className="text-sm text-gray-500">No approved tutors yet.</p>
        ) : (
          <div className="space-y-3">
            {approvedTutors.map((tutor) => (
              <TutorCard
                key={tutor.id}
                tutor={tutor}
                actions={
                  <DeleteButton
                    onConfirm={() => deleteMutation.mutate(tutor.id)}
                    isPending={deleteMutation.isPending}
                  />
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface TutorCardProps {
  tutor: TutorProfile;
  actions: React.ReactNode;
}

function TutorCard({ tutor, actions }: TutorCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{getFullName(tutor.user.profile)}</p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              tutor.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {tutor.isApproved ? 'Approved' : 'Pending'}
          </span>
        </div>
        <p className="text-sm text-indigo-600 font-semibold">${tutor.hourlyRate}/hr</p>
        <div className="flex flex-wrap gap-1.5">
          {tutor.subjects.map((subject) => (
            <span
              key={subject}
              className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
      <div className="shrink-0">{actions}</div>
    </div>
  );
}

interface DeleteButtonProps {
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteButton({ onConfirm, isPending }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Are you sure?</span>
        <button
          onClick={() => {
            onConfirm();
            setIsConfirming(false);
          }}
          disabled={isPending}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          Yes
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>
  );
}
