import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useConfirmDialogStore } from '@/store/confirm-dialog.store';

export function ConfirmDialog() {
  const { isOpen, options, close } = useConfirmDialogStore();
  const { t } = useTranslation();

  if (!isOpen || !options) {
    return null;
  }

  const handleConfirm = () => {
    options.onConfirm();
    close();
  };

  const handleCancel = () => {
    options.onCancel?.();
    close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-gray-900"
            >
              {options.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{options.message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
