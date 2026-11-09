import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogSecondaryAction {
  label: string;
  description?: string;
  onClick: () => void;
}

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Acción irreversible: el botón de confirmar usa el rojo de sistema (DESIGN.md §4.3). */
  destructive?: boolean;
  /** Lista de consecuencias que se muestran antes de confirmar. */
  details?: string[];
  /** Encabezado de la lista de consecuencias. */
  detailsTitle?: string;
  /** Texto que la persona debe escribir para habilitar el botón de confirmar. */
  confirmText?: string;
  /** Alternativa recomendada y no destructiva (p. ej. ocultar en vez de eliminar). */
  secondaryAction?: ConfirmDialogSecondaryAction;
}

export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Continuar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
  details,
  detailsTitle = 'Si confirmas:',
  confirmText,
  secondaryAction,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const titleId = useId();
  const messageId = useId();
  const inputId = useId();

  useEffect(() => {
    if (open) {
      setTyped('');
    }
  }, [open, confirmText]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  const isBlocked = Boolean(confirmText) && typed.trim() !== confirmText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1418]/45 px-4 py-16 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#1A1418]/10 bg-white p-6 shadow-lg sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <h3 id={titleId} className="font-serif text-[22px] font-semibold leading-[1.3] text-[#1A1418]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#5C5257] transition-colors duration-150 ease-out hover:text-[#A8001A]"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <p id={messageId} className="mt-2 text-base leading-[1.7] text-[#1A1418]">
          {message}
        </p>

        {secondaryAction ? (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="mt-5 flex w-full flex-col items-start gap-1 rounded-xl border-2 border-[#A8001A] bg-[#FFF8F5] p-4 text-left"
          >
            <span className="flex items-center gap-2 text-[15px] font-semibold text-[#1A1418]">
              {secondaryAction.label}
              <span className="rounded-full bg-[#FDC003] px-2 py-0.5 text-xs font-medium text-[#1A1418]">
                Recomendado
              </span>
            </span>
            {secondaryAction.description ? (
              <span className="text-sm leading-[1.6] text-[#5C5257]">{secondaryAction.description}</span>
            ) : null}
          </button>
        ) : null}

        {details && details.length > 0 ? (
          <div
            className={`mt-5 rounded-xl border p-4 ${
              destructive ? 'border-[#F3C9C5] bg-[#FDF3F2]' : 'border-[#1A1418]/10 bg-[#FFF8F5]'
            }`}
          >
            <p className={`text-sm font-semibold ${destructive ? 'text-[#8C1D18]' : 'text-[#1A1418]'}`}>
              {detailsTitle}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-[1.6] text-[#1A1418]">
              {details.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {confirmText ? (
          <div className="mt-5 space-y-1.5">
            <label htmlFor={inputId} className="block text-sm font-medium text-[#1A1418]">
              Para confirmar, escribe{' '}
              <span className="font-mono text-[13px] tracking-[0.5px]">{confirmText}</span>
            </label>
            <input
              id={inputId}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 font-mono text-sm tracking-[0.5px] text-[#1A1418] outline-none focus:border-[#A8001A]"
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-lg border border-[#1A1418]/20 px-5 text-sm font-medium text-[#1A1418]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBlocked}
            className={`min-h-11 rounded-lg px-5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
              destructive ? 'bg-[#B3261E]' : 'bg-[#A8001A]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
