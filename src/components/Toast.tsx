import { useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  text: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-[#1B6F3A]/30 bg-[#EAF8EE] text-[#1B6F3A]',
  error: 'border-[#A8001A]/30 bg-[#FCEDED] text-[#9E2D2D]',
  info: 'border-[#E6D0C9] bg-white text-[#4A1F1F]',
};

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

  return (
    <div
      role="status"
      className={`rounded-xl border p-4 text-sm font-medium shadow-sm ${VARIANT_STYLES[toast.variant]}`}
    >
      {toast.text}
    </div>
  );
}
