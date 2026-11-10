import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, ChevronLeft, ChevronRight, ExternalLink, Pencil, RotateCcw, Send, X } from 'lucide-react';
import {
  approveInstagramPosts,
  bogotaDayKey,
  cancelInstagramPosts,
  fetchPostLog,
  formatBogota,
  itemImageUrl,
  POST_SOURCE_LABELS,
  publishInstagramPostNow,
  retryInstagramPost,
  type InstagramPost,
} from '../../../services/instagramService';
import { FeedPreview, ghostButton, primaryButton, secondaryButton, StatusBadge } from './shared';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface CalendarViewProps {
  posts: InstagramPost[];
  month: { year: number; month: number };
  onMonthChange: (next: { year: number; month: number }) => void;
  isLoading: boolean;
  userId: string | null;
  onEdit: (post: InstagramPost) => void;
  onChanged: () => void;
  onNotify: (text: string) => void;
  onError: (error: unknown) => void;
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)));
}

export default function CalendarView({ posts, month, onMonthChange, isLoading, userId, onEdit, onChanged, onNotify, onError }: CalendarViewProps) {
  const [mode, setMode] = useState<'mes' | 'lista'>('mes');
  const [selected, setSelected] = useState<InstagramPost | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [log, setLog] = useState<Array<{ level: string; message: string; created_at: string }>>([]);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    setChecked([]);
  }, [posts]);

  useEffect(() => {
    if (selected) {
      const fresh = posts.find((post) => post.id === selected.id);
      setSelected(fresh ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  useEffect(() => {
    if (!selected) return;
    fetchPostLog(selected.id).then(setLog).catch(() => setLog([]));
  }, [selected?.id, selected?.status]);

  const byDay = useMemo(() => {
    const map = new Map<string, InstagramPost[]>();
    posts.forEach((post) => {
      const key = bogotaDayKey(post.scheduled_at);
      map.set(key, [...(map.get(key) ?? []), post]);
    });
    return map;
  }, [posts]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(month.year, month.month, 1));
    const offset = (first.getUTCDay() + 6) % 7; // lunes primero
    const daysInMonth = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate();
    const result: Array<{ key: string; day: number } | null> = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      result.push({ key, day });
    }
    while (result.length % 7) result.push(null);
    return result;
  }, [month]);

  const todayKey = bogotaDayKey(new Date().toISOString());

  const run = async (action: () => Promise<void>, message: string) => {
    setIsWorking(true);
    try {
      await action();
      onNotify(message);
      onChanged();
    } catch (error) {
      onError(error);
    } finally {
      setIsWorking(false);
      setProgress('');
    }
  };

  const changeMonth = (delta: number) => {
    const date = new Date(Date.UTC(month.year, month.month + delta, 1));
    onMonthChange({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
  };

  const pendingInList = posts.filter((post) => post.status === 'pendiente').map((post) => post.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#1A1418]/20 bg-white">
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <h3 className="min-w-44 text-center font-serif text-[22px] font-semibold capitalize text-[#1A1418]">{monthLabel(month.year, month.month)}</h3>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#1A1418]/20 bg-white">
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div role="group" aria-label="Vista" className="flex rounded-lg border border-[#1A1418]/20 bg-white p-1">
          {(['mes', 'lista'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`min-h-9 rounded-md px-4 text-sm font-medium capitalize ${mode === option ? 'bg-[#A8001A] text-[#FFF8F5]' : 'text-[#1A1418]'}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-[#5C5257]">Cargando calendario...</p> : null}

      {mode === 'mes' ? (
        <div className="overflow-x-auto rounded-2xl border border-[#1A1418]/10 bg-white">
          <div className="grid min-w-[700px] grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div key={day} className="border-b border-[#1A1418]/10 px-2 py-2 text-xs font-medium text-[#5C5257]">{day}</div>
            ))}
            {cells.map((cell, index) => (
              <div key={cell?.key ?? `vacío-${index}`} className={`min-h-28 border-b border-r border-[#1A1418]/5 p-1.5 ${cell?.key === todayKey ? 'bg-[#FFF8F5]' : ''}`}>
                {cell ? (
                  <>
                    <span className={`font-mono text-xs ${cell.key === todayKey ? 'font-medium text-[#A8001A]' : 'text-[#5C5257]'}`}>{cell.day}</span>
                    <div className="mt-1 space-y-1">
                      {(byDay.get(cell.key) ?? []).map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setSelected(post)}
                          className="block w-full rounded-md border border-[#1A1418]/10 p-1 text-left hover:border-[#A8001A]"
                        >
                          <span className="block font-mono text-[11px] text-[#5C5257]">{formatBogota(post.scheduled_at, { dateStyle: undefined })}</span>
                          <span className="block truncate text-xs font-medium text-[#1A1418]">{post.title || `${post.items.length} imágenes`}</span>
                          <StatusBadge status={post.status} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingInList.length ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setChecked(checked.length === pendingInList.length ? [] : pendingInList)}
                className={ghostButton}
              >
                {checked.length === pendingInList.length ? 'Quitar selección' : `Seleccionar pendientes (${pendingInList.length})`}
              </button>
              <button
                type="button"
                disabled={!checked.length || isWorking}
                onClick={() => run(() => approveInstagramPosts(checked, userId), `${checked.length} carrusel(es) aprobado(s).`)}
                className={primaryButton}
              >
                <CheckCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                Aprobar seleccionados
              </button>
            </div>
          ) : null}
          {posts.length === 0 && !isLoading ? (
            <p className="rounded-2xl border border-[#1A1418]/10 bg-white p-6 text-sm text-[#5C5257]">No hay carruseles en este mes.</p>
          ) : null}
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="flex items-center gap-3 rounded-2xl border border-[#1A1418]/10 bg-white p-3">
                {post.status === 'pendiente' ? (
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${post.title || 'carrusel'}`}
                    checked={checked.includes(post.id)}
                    onChange={() => setChecked((prev) => (prev.includes(post.id) ? prev.filter((id) => id !== post.id) : [...prev, post.id]))}
                    className="h-5 w-5 accent-[#A8001A]"
                  />
                ) : (
                  <span className="w-5" aria-hidden="true" />
                )}
                {post.items[0] ? <FeedPreview src={itemImageUrl(post.items[0])} alt="" className="w-12 shrink-0" /> : null}
                <button type="button" onClick={() => setSelected(post)} className="min-w-0 flex-1 text-left">
                  <span className="block font-mono text-xs text-[#5C5257]">{formatBogota(post.scheduled_at)}</span>
                  <span className="block truncate text-sm font-medium text-[#1A1418]">{post.title || post.caption.slice(0, 80) || 'Sin título'}</span>
                  <span className="text-xs text-[#5C5257]">{POST_SOURCE_LABELS[post.source]} · {post.items.length} imágenes</span>
                </button>
                <StatusBadge status={post.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1A1418]/45" role="dialog" aria-modal="true" aria-labelledby="detalle-carrusel">
          <div className="h-full w-full max-w-lg overflow-y-auto bg-[#FFF8F5] p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="detalle-carrusel" className="font-serif text-[22px] font-semibold text-[#1A1418]">{selected.title || 'Carrusel'}</h3>
                <p className="mt-1 font-mono text-xs text-[#5C5257]">{formatBogota(selected.scheduled_at)} · {POST_SOURCE_LABELS[selected.source]}</p>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-lg text-[#5C5257] hover:text-[#A8001A]">
                <X size={22} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {selected.status === 'pendiente' && new Date(selected.scheduled_at).getTime() < Date.now() ? (
              <p className="mt-4 rounded-lg bg-[#FED968] p-3 text-sm text-[#1A1418]">
                Su hora pasó sin aprobación, así que no se publicó. Edítalo para elegir otra fecha.
              </p>
            ) : null}
            {selected.last_error && selected.status !== 'publicado' ? (
              <p role="alert" className="mt-4 rounded-lg border border-[#F3C9C5] bg-[#FDECEA] p-3 text-sm text-[#8C1D18]">{selected.last_error}</p>
            ) : null}

            <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-2">
              {selected.items.map((item, index) => (
                <FeedPreview key={`${item.source_path}-${index}`} src={itemImageUrl(item)} alt={item.alt_text ?? ''} className="w-40 shrink-0 snap-start" />
              ))}
            </div>

            <p className="mt-4 whitespace-pre-line rounded-lg border border-[#1A1418]/10 bg-white p-3 text-sm leading-[1.6] text-[#1A1418]">
              {selected.caption || 'Sin texto todavía.'}
            </p>

            {progress ? <p role="status" className="mt-3 text-sm font-medium">{progress}</p> : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status === 'publicado' && selected.permalink ? (
                <a href={selected.permalink} target="_blank" rel="noopener noreferrer" className={primaryButton}>
                  <ExternalLink size={18} strokeWidth={1.75} aria-hidden="true" />
                  Ver en Instagram
                </a>
              ) : null}
              {['pendiente', 'borrador'].includes(selected.status) ? (
                <button type="button" disabled={isWorking} onClick={() => run(() => approveInstagramPosts([selected.id], userId), 'Carrusel aprobado: se publicará a su hora.')} className={primaryButton}>
                  <CheckCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                  Aprobar
                </button>
              ) : null}
              {selected.status === 'fallido' ? (
                <button type="button" disabled={isWorking} onClick={() => run(() => retryInstagramPost(selected.id), 'Se reintentará en la próxima pasada (máx. 5 minutos).')} className={primaryButton}>
                  <RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />
                  Reintentar
                </button>
              ) : null}
              {['borrador', 'pendiente', 'programado', 'fallido'].includes(selected.status) ? (
                <>
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() =>
                      run(async () => {
                        const result = await publishInstagramPostNow(selected.id, userId, setProgress);
                        if (result === 'fallido') throw new Error('No se pudo publicar. Revisa el motivo arriba.');
                      }, 'Publicación enviada a Instagram.')
                    }
                    className={secondaryButton}
                  >
                    <Send size={18} strokeWidth={1.75} aria-hidden="true" />
                    Publicar ahora
                  </button>
                  <button type="button" disabled={isWorking} onClick={() => { onEdit(selected); setSelected(null); }} className={secondaryButton}>
                    <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
                    Editar
                  </button>
                  <button type="button" disabled={isWorking} onClick={() => run(() => cancelInstagramPosts([selected.id]), 'Carrusel cancelado.')} className={ghostButton}>
                    Cancelar carrusel
                  </button>
                </>
              ) : null}
            </div>

            {log.length ? (
              <details className="mt-5">
                <summary className="cursor-pointer text-sm font-medium text-[#1A1418]">Historial</summary>
                <ul className="mt-2 space-y-1">
                  {log.map((entry, index) => (
                    <li key={index} className={`text-xs ${entry.level === 'error' ? 'text-[#8C1D18]' : 'text-[#5C5257]'}`}>
                      <span className="font-mono">{formatBogota(entry.created_at)}</span> · {entry.message}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
