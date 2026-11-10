import type { InstagramPostStatus } from '../../../services/instagramService';
import { POST_STATUS_LABELS } from '../../../services/instagramService';

const STATUS_STYLES: Record<InstagramPostStatus, string> = {
  borrador: 'border border-[#1A1418]/20 bg-white text-[#5C5257]',
  pendiente: 'bg-[#FED968] text-[#1A1418]',
  programado: 'bg-[#1A1418] text-[#FFF8F5]',
  publicando: 'bg-[#1A1418]/10 text-[#1A1418]',
  publicado: 'bg-[#EAF8EE] text-[#1B6F3A]',
  fallido: 'bg-[#FDECEA] text-[#8C1D18]',
  cancelado: 'bg-[#1A1418]/5 text-[#5C5257] line-through',
};

export function StatusBadge({ status }: { status: InstagramPostStatus }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {POST_STATUS_LABELS[status]}
    </span>
  );
}

/** Vista previa 4:5 tal como queda en el feed: la foto completa sobre el gris de estudio. */
export function FeedPreview({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`aspect-[4/5] overflow-hidden rounded-lg bg-[#E8E8E8] ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-contain" />
    </div>
  );
}

export const inputClass =
  'min-h-11 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 text-base text-[#1A1418] outline-none focus:border-[#A8001A]';
export const labelClass = 'block text-sm font-medium text-[#1A1418]';
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#A8001A] px-5 text-sm font-medium text-[#FFF8F5] transition-colors duration-150 ease-out hover:bg-[#860015] disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#1A1418]/20 bg-white px-4 text-sm font-medium text-[#1A1418] disabled:cursor-not-allowed disabled:opacity-50';
export const ghostButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-[#A8001A] disabled:opacity-50';
