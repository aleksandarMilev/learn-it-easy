import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';
import { useConfirmDialogStore, type ConfirmDialogOptions } from '@/store/confirm-dialog.store';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <svg data-testid="alert-icon" />,
}));

const openDialog = (overrides: Partial<ConfirmDialogOptions> = {}) => {
  useConfirmDialogStore.setState({
    isOpen: true,
    options: {
      title: 'Delete item?',
      message: 'This cannot be undone.',
      onConfirm: vi.fn(),
      ...overrides,
    },
  });
};

describe('ConfirmDialog', () => {
  beforeEach(() => {
    useConfirmDialogStore.setState({ isOpen: false, options: null });
  });

  it('renders nothing when the dialog is closed', () => {
    const { container } = render(<ConfirmDialog />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title and message when open', () => {
    openDialog();
    render(<ConfirmDialog />);

    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('renders cancel and confirm buttons when open', () => {
    openDialog();
    render(<ConfirmDialog />);

    expect(
      screen.getByRole('button', { name: 'common.cancel' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'common.confirm' }),
    ).toBeInTheDocument();
  });

  it('calls onConfirm and closes the dialog when the confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    openDialog({ onConfirm: handleConfirm });
    render(<ConfirmDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(useConfirmDialogStore.getState().isOpen).toBe(false);
  });

  it('calls onCancel and closes the dialog when the cancel button is clicked', () => {
    const handleCancel = vi.fn();
    openDialog({ onCancel: handleCancel });
    render(<ConfirmDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(handleCancel).toHaveBeenCalledTimes(1);
    expect(useConfirmDialogStore.getState().isOpen).toBe(false);
  });

  it('closes the dialog when the cancel button is clicked without an onCancel callback', () => {
    openDialog();
    render(<ConfirmDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(useConfirmDialogStore.getState().isOpen).toBe(false);
  });

  it('closes the dialog when the backdrop is clicked', () => {
    openDialog();
    render(<ConfirmDialog />);

    fireEvent.click(screen.getByRole('dialog'));

    expect(useConfirmDialogStore.getState().isOpen).toBe(false);
  });

  it('does not close the dialog when the modal card itself is clicked', () => {
    openDialog();
    render(<ConfirmDialog />);

    fireEvent.click(screen.getByText('Delete item?'));

    expect(useConfirmDialogStore.getState().isOpen).toBe(true);
  });
});
