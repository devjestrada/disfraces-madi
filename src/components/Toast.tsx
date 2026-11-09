import { useEffect } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  text: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

// DESIGN.md §4.3: los estados usan colores semánticos estándar,
// nunca el Rojo Madi para errores.
const VARIANT_STYLES: Record<ToastVariant, { box: string; badge: string }> = {
  success: { box: 'border-[#1B6F3A]/30 bg-[#EAF8EE] text-[#1B6F3A]', badge: 'bg-[#1B6F3A]' },
  error: { box: 'border-[#B3261E]/30 bg-[#FDECEA] text-[#8C1D18]', badge: 'bg-[#B3261E]' },
  info: { box: 'border-[#1A1418]/10 bg-white text-[#1A1418]', badge: 'bg-[#5C5257]' },
};

const VARIANT_ICON = {
  success: Check,
  error: AlertCircle,
  info: Info,
} as const;

export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) {
    return null;
  }

  const styles = VARIANT_STYLES[toast.variant];
  const Icon = VARIANT_ICON[toast.variant];

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded-xl border py-2 pl-4 pr-2 text-sm font-medium shadow-sm ${styles.box}`}
    >
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${styles.badge}`}
        >
          <Icon size={14} strokeWidth={2.5} />
        </span>
        {toast.text}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#5C5257] transition-colors duration-150 ease-out hover:text-[#1A1418]"
      >
        <X size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}
