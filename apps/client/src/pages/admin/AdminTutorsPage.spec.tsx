import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminTutorsPage } from './AdminTutorsPage';
import { adminApi } from '@/api/admin.api';
import { tutorsApi } from '@/api/tutors.api';
import type { TutorProfile } from '@/types';

vi.mock('@/api/admin.api');
vi.mock('@/api/tutors.api');
vi.mock('@/store/toast.store', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const mockConfirm = vi.fn();
vi.mock('@/store/confirm-dialog.store', () => ({
  useConfirm: () => ({ confirm: mockConfirm }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  GraduationCap: () => null,
  CheckCircle: () => null,
  Trash2: () => null,
}));

const mockTutor = (overrides: Partial<TutorProfile> = {}): TutorProfile => ({
  id: 'tutor-1',
  userId: 'user-1',
  subjects: ['Mathematics'],
  hourlyRate: 50,
  bio: null,
  isApproved: false,
  availability: [],
  user: { id: 'user-1', profile: { firstName: 'Alice', lastName: 'Smith', bio: null, avatarUrl: null } },
  ...overrides,
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminTutorsPage />
    </QueryClientProvider>,
  );
}

describe('AdminTutorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering pending tutors', () => {
    it('should render a pending tutor name and the Approve button', async () => {
      vi.mocked(tutorsApi.getAll).mockResolvedValue([mockTutor()]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'admin.approveButton' })).toBeInTheDocument();
    });
  });

  describe('approve confirmation', () => {
    it('should open the confirmation dialog when the Approve button is clicked', async () => {
      vi.mocked(tutorsApi.getAll).mockResolvedValue([mockTutor()]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'admin.approveButton' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'admin.approveButton' }));

      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ onConfirm: expect.any(Function) }),
      );
    });

    it('should NOT call adminApi.approveTutor before the user confirms', async () => {
      vi.mocked(tutorsApi.getAll).mockResolvedValue([mockTutor()]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'admin.approveButton' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'admin.approveButton' }));

      expect(vi.mocked(adminApi.approveTutor)).not.toHaveBeenCalled();
    });

    it('should call adminApi.approveTutor with the correct tutorId when the user confirms', async () => {
      const tutor = mockTutor({ id: 'tutor-42' });
      vi.mocked(tutorsApi.getAll).mockResolvedValue([tutor]);
      vi.mocked(adminApi.approveTutor).mockResolvedValue({ ...tutor, isApproved: true });

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'admin.approveButton' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'admin.approveButton' }));

      const { onConfirm } = mockConfirm.mock.calls[0]![0] as { onConfirm: () => void };
      onConfirm();

      await waitFor(() => {
        expect(vi.mocked(adminApi.approveTutor)).toHaveBeenCalledWith('tutor-42');
      });
    });

    it('should NOT call adminApi.approveTutor when the user cancels the confirmation', async () => {
      vi.mocked(tutorsApi.getAll).mockResolvedValue([mockTutor()]);

      renderPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'admin.approveButton' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'admin.approveButton' }));

      const { onCancel } = mockConfirm.mock.calls[0]![0] as { onCancel?: () => void };
      if (onCancel) {
        onCancel();
      }

      expect(vi.mocked(adminApi.approveTutor)).not.toHaveBeenCalled();
    });
  });
});
