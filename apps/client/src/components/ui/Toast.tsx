import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toast.store';
import type { ToastItem, ToastVariant } from '@/store/toast.store';

type TypeConfig = {
  icon: React.ElementType;
  iconColor: string;
  accentBg: string;
  contentBg: string;
  title: string;
};

const typeConfig: Record<ToastVariant, TypeConfig> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    accentBg: 'bg-green-500',
    contentBg: 'bg-green-50',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-500',
    accentBg: 'bg-red-500',
    contentBg: 'bg-red-50',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    accentBg: 'bg-amber-500',
    contentBg: 'bg-amber-50',
    title: 'Warning',
  },
  info: {
    icon: Info,
    iconColor: 'text-indigo-500',
    accentBg: 'bg-indigo-500',
    contentBg: 'bg-indigo-50',
    title: 'Info',
  },
};

type Props = {
  toast: ToastItem;
};

export function Toast({ toast }: Props) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [isExiting, setIsExiting] = useState(false);

  const config = typeConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => setIsExiting(true), 4800);
    return () => clearTimeout(timer);
  }, []);

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (isExiting && e.animationName === 'toastExit') {
      removeToast(toast.id);
    }
  };

  return (
    <div
      className={`flex w-80 overflow-hidden rounded-xl border border-gray-200 shadow-xl ${
        isExiting ? 'animate-toast-exit' : 'animate-toast-enter'
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={`w-1 shrink-0 ${config.accentBg}`} />

      <div className={`flex flex-1 flex-col ${config.contentBg}`}>
        <div className="flex items-start gap-3 px-4 py-3.5">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{config.title}</p>
            <p className="mt-0.5 break-words text-sm text-gray-600">{toast.message}</p>
          </div>
          <button
            onClick={() => setIsExiting(true)}
            aria-label="Dismiss"
            className="shrink-0 text-gray-400 transition-colors hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-1 w-full bg-gray-200/60">
          <div className={`h-full animate-progress-shrink origin-left ${config.accentBg}`} />
        </div>
      </div>
    </div>
  );
}
