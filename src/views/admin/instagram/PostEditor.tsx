import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, RefreshCw, Search, Send, Sparkles, X } from 'lucide-react';
import type { AdminCategory, AdminCostume } from '../../../types';
import {
  createInstagramPost,
  fetchCostumeGalleries,
  fetchPrimaryAltTexts,
  fromBogotaInput,
  generateInstagramCaption,
  itemImageUrl,
  publishInstagramPostNow,
  toBogotaInput,
  updateInstagramPost,
  uploadInstagramImage,
  type InstagramPost,
  type InstagramPostItem,
  type InstagramPostStatus,
} from '../../../services/instagramService';
import { FeedPreview, ghostButton, inputClass, labelClass, primaryButton, secondaryButton } from './shared';

const MAX_ITEMS = 10;
const MAX_CAPTION = 2200;

interface PostEditorProps {
  post: InstagramPost | null;
  costumes: AdminCostume[];
  categories: AdminCategory[];
  userId: string | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (error: unknown) => void;
}

function defaultSchedule() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${toBogotaInput(tomorrow.toISOString()).slice(0, 10)}T19:00`;
}

export default function PostEditor({ post, costumes, categories, userId, onClose, onSaved, onError }: PostEditorProps) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [items, setItems] = useState<InstagramPostItem[]>(post?.items ?? []);
  const [caption, setCaption] = useState(post?.caption ?? '');
  const [theme, setTheme] = useState('');
  const [scheduledLocal, setScheduledLocal] = useState(post ? toBogotaInput(post.scheduled_at) : defaultSchedule());
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [galleryNote, setGalleryNote] = useState('');

  const costumeById = useMemo(() => new Map(costumes.map((costume) => [costume.id, costume])), [costumes]);

  // Carrusel de un solo disfraz (por ejemplo, de una campaña "un disfraz por carrusel").
  const singleCostumeId =
    items.length > 0 && items[0].costume_id && items.every((item) => item.costume_id === items[0].costume_id)
      ? items[0].costume_id
      : null;

  const loadCurrentPhotos = async () => {
    if (!singleCostumeId) return;
    setIsLoadingGallery(true);
    setGalleryNote('');
    try {
      const gallery = (await fetchCostumeGalleries([singleCostumeId])).get(singleCostumeId);
      if (!gallery || gallery.items.length < 2) {
        setGalleryNote('El disfraz tiene menos de 2 fotos en el catálogo: se mantienen las del carrusel.');
        return;
      }
      setItems(gallery.items);
      setGalleryNote(
        `Se cargaron ${gallery.items.length} fotos del catálogo${gallery.leftOut ? ` (${gallery.leftOut} quedan fuera: máximo 10)` : ''}.`
      );
    } catch (error) {
      onError(error);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const candidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return costumes.filter(
      (costume) =>
        costume.primary_image &&
        (!categoryId || costume.category_id === categoryId) &&
        (!query || `${costume.name} ${costume.category_name ?? ''}`.toLowerCase().includes(query))
    );
  }, [costumes, search, categoryId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  const selectedCostumeIds = new Set(items.map((item) => item.costume_id).filter(Boolean));

  const toggleCostume = async (costume: AdminCostume) => {
    if (selectedCostumeIds.has(costume.id)) {
      setItems((prev) => prev.filter((item) => item.costume_id !== costume.id));
      return;
    }
    if (items.length >= MAX_ITEMS || !costume.primary_image) return;
    const newItem: InstagramPostItem = {
      position: items.length,
      costume_id: costume.id,
      source_bucket: 'costume-images',
      source_path: costume.primary_image,
      alt_text: null,
    };
    setItems((prev) => [...prev, newItem]);
    try {
      const alts = await fetchPrimaryAltTexts([costume.id]);
      const alt = alts.get(costume.id);
      if (alt) {
        setItems((prev) => prev.map((item) => (item.costume_id === costume.id && !item.alt_text ? { ...item, alt_text: alt } : item)));
      }
    } catch {
      // el texto alternativo es opcional
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const room = MAX_ITEMS - items.length;
      const uploaded: InstagramPostItem[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        uploaded.push(await uploadInstagramImage(file));
      }
      setItems((prev) => [...prev, ...uploaded]);
    } catch (error) {
      onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setFormError('');
    try {
      const ids = items.map((item) => item.costume_id).filter((id): id is string => Boolean(id));
      setCaption(await generateInstagramCaption(ids, theme || undefined));
    } catch (error) {
      onError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const validate = (status: InstagramPostStatus, now: boolean) => {
    if (items.length < 2) return 'Elige al menos 2 imágenes para el carrusel.';
    if (items.length > MAX_ITEMS) return 'Un carrusel admite máximo 10 imágenes.';
    if (status !== 'borrador' && !caption.trim()) return 'Escribe el texto del carrusel o genéralo con IA.';
    if (!now && status === 'programado' && new Date(fromBogotaInput(scheduledLocal)).getTime() < Date.now()) {
      return 'La fecha de publicación ya pasó. Elige una fecha futura o usa "Publicar ahora".';
    }
    return '';
  };

  const save = async (status: InstagramPostStatus, publishNow = false) => {
    const problem = validate(status, publishNow);
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError('');
    setIsSaving(true);
    try {
      const input = {
        title: title.trim() || null,
        caption: caption.trim(),
        scheduled_at: fromBogotaInput(scheduledLocal),
        status,
        items: items.map((item, index) => ({ ...item, position: index })),
      };
      let postId = post?.id ?? '';
      if (post) {
        await updateInstagramPost(post.id, input, userId);
      } else {
        postId = await createInstagramPost(input, userId);
      }

      if (publishNow) {
        const result = await publishInstagramPostNow(postId, userId, setProgress);
        onSaved(
          result === 'publicado'
            ? '¡Listo! El carrusel ya está publicado en Instagram.'
            : result === 'fallido'
              ? 'No se pudo publicar el carrusel. Revisa el motivo en el calendario.'
              : 'El carrusel se está publicando; en unos minutos lo verás como publicado.'
        );
      } else {
        onSaved(status === 'borrador' ? 'Borrador guardado.' : 'Carrusel programado.');
      }
    } catch (error) {
      onError(error);
    } finally {
      setIsSaving(false);
      setProgress('');
    }
  };

  const itemLabel = (item: InstagramPostItem) =>
    item.costume_id ? costumeById.get(item.costume_id)?.name ?? 'Disfraz' : 'Imagen propia';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1418]/45 px-3 py-6 sm:px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-carrusel-titulo"
    >
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-[#FFF8F5] p-4 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 id="editor-carrusel-titulo" className="font-serif text-[28px] font-semibold leading-[1.25] text-[#1A1418]">
            {post ? 'Editar carrusel' : 'Nuevo carrusel'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[#5C5257] hover:text-[#A8001A]"
          >
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Selección */}
          <section aria-labelledby="editor-elegir" className="space-y-3 rounded-2xl border border-[#1A1418]/10 bg-white p-4">
            <h4 id="editor-elegir" className="font-serif text-[22px] font-semibold text-[#1A1418]">
              1. Elige las imágenes
            </h4>
            <p className="text-sm text-[#5C5257]">
              De 2 a 10. Toca un disfraz para agregarlo o quitarlo; también puedes subir imágenes propias.
            </p>
            <div className="flex flex-wrap gap-2">
              <label className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-[#1A1418]/20 bg-white px-3">
                <Search size={18} strokeWidth={1.75} aria-hidden="true" className="text-[#5C5257]" />
                <span className="sr-only">Buscar disfraz</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar disfraz"
                  className="w-full min-w-0 bg-transparent text-base outline-none"
                />
              </label>
              <label className="sr-only" htmlFor="editor-categoria">Categoría</label>
              <select
                id="editor-categoria"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="min-h-11 rounded-lg border border-[#1A1418]/20 bg-white px-3 text-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="grid max-h-[420px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {candidates.map((costume) => {
                const selected = selectedCostumeIds.has(costume.id);
                const order = items.findIndex((item) => item.costume_id === costume.id);
                return (
                  <button
                    key={costume.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => void toggleCostume(costume)}
                    disabled={!selected && items.length >= MAX_ITEMS}
                    className={`relative rounded-lg border-2 p-1 text-left disabled:opacity-40 ${
                      selected ? 'border-[#A8001A]' : 'border-transparent'
                    }`}
                  >
                    <FeedPreview src={itemImageUrl({ source_bucket: 'costume-images', source_path: costume.primary_image! })} alt="" />
                    <span className="mt-1 block truncate text-xs font-medium text-[#1A1418]">{costume.name}</span>
                    {selected ? (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#A8001A] font-mono text-xs text-[#FFF8F5]">
                        {order + 1}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {candidates.length === 0 ? (
                <p className="col-span-full text-sm text-[#5C5257]">No hay disfraces con foto que coincidan.</p>
              ) : null}
            </div>
            <label className={`${secondaryButton} cursor-pointer ${isUploading || items.length >= MAX_ITEMS ? 'pointer-events-none opacity-50' : ''}`}>
              <ImagePlus size={18} strokeWidth={1.75} aria-hidden="true" />
              {isUploading ? 'Subiendo...' : 'Subir imágenes propias'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => {
                  void handleUpload(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
          </section>

          {/* Carrusel */}
          <section aria-labelledby="editor-carrusel" className="space-y-4 rounded-2xl border border-[#1A1418]/10 bg-white p-4">
            <h4 id="editor-carrusel" className="font-serif text-[22px] font-semibold text-[#1A1418]">
              2. Orden y textos
            </h4>
            <p className="font-mono text-xs text-[#5C5257]">{items.length} / {MAX_ITEMS} imágenes · formato del feed 4:5</p>
            {singleCostumeId ? (
              <div className="space-y-1">
                <button type="button" onClick={() => void loadCurrentPhotos()} disabled={isLoadingGallery} className={secondaryButton}>
                  <RefreshCw size={18} strokeWidth={1.75} aria-hidden="true" />
                  {isLoadingGallery ? 'Cargando fotos...' : 'Usar las fotos actuales del disfraz'}
                </button>
                {galleryNote ? <p role="status" className="text-xs text-[#5C5257]">{galleryNote}</p> : null}
              </div>
            ) : null}
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[#1A1418]/20 p-4 text-sm text-[#5C5257]">
                Aún no hay imágenes. Elige disfraces a la izquierda.
              </p>
            ) : (
              <ol className="space-y-2">
                {items.map((item, index) => (
                  <li key={`${item.source_path}-${index}`} className="flex gap-3 rounded-lg border border-[#1A1418]/10 p-2">
                    <FeedPreview src={itemImageUrl(item)} alt="" className="w-16 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate text-sm font-medium text-[#1A1418]">
                        <span className="font-mono text-xs text-[#5C5257]">{index + 1}.</span> {itemLabel(item)}
                      </p>
                      <label className="block text-xs font-medium text-[#5C5257]">
                        Texto alternativo
                        <input
                          value={item.alt_text ?? ''}
                          onChange={(event) =>
                            setItems((prev) => prev.map((current, i) => (i === index ? { ...current, alt_text: event.target.value } : current)))
                          }
                          placeholder="Qué se ve en la imagen"
                          className="mt-1 min-h-9 w-full rounded-md border border-[#1A1418]/20 px-2 text-sm text-[#1A1418] outline-none focus:border-[#A8001A]"
                        />
                      </label>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1A1418]/20 disabled:opacity-30">
                        <ArrowUp size={16} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Bajar" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1A1418]/20 disabled:opacity-30">
                        <ArrowDown size={16} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} aria-label="Quitar" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#1A1418]/20 text-[#5C5257]">
                        <X size={16} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <label className={labelClass}>
              Nombre interno <span className="font-normal text-[#5C5257]">(opcional, no se publica)</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej.: Marimondas de temporada" className={`mt-1.5 ${inputClass}`} />
            </label>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                <label className={`${labelClass} flex-1`}>
                  Tema para la IA <span className="font-normal text-[#5C5257]">(opcional)</span>
                  <input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Ej.: Novedades para el Carnaval 2027" className={`mt-1.5 ${inputClass}`} />
                </label>
                <button type="button" onClick={() => void handleGenerate()} disabled={isGenerating || items.length === 0} className={secondaryButton}>
                  <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
                  {isGenerating ? 'Escribiendo...' : 'Generar con IA'}
                </button>
              </div>
              <label className={labelClass} htmlFor="editor-caption">Texto del carrusel</label>
              <textarea
                id="editor-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value.slice(0, MAX_CAPTION))}
                rows={8}
                className="w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 py-2.5 text-base leading-[1.7] text-[#1A1418] outline-none focus:border-[#A8001A]"
              />
              <p className="text-right font-mono text-xs text-[#5C5257]">{caption.length} / {MAX_CAPTION}</p>
            </div>

            <label className={labelClass}>
              Fecha y hora de publicación <span className="font-normal text-[#5C5257]">(hora de Colombia)</span>
              <input type="datetime-local" value={scheduledLocal} onChange={(event) => setScheduledLocal(event.target.value)} className={`mt-1.5 font-mono ${inputClass}`} />
            </label>
          </section>
        </div>

        {formError ? (
          <p role="alert" className="mt-4 rounded-lg border border-[#F3C9C5] bg-[#FDECEA] p-3 text-sm font-medium text-[#8C1D18]">{formError}</p>
        ) : null}
        {progress ? <p role="status" className="mt-4 text-sm font-medium text-[#1A1418]">{progress}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-[#1A1418]/10 pt-4">
          <button type="button" onClick={onClose} disabled={isSaving} className={ghostButton}>Cancelar</button>
          <button type="button" onClick={() => void save('borrador')} disabled={isSaving} className={secondaryButton}>Guardar borrador</button>
          <button type="button" onClick={() => void save('programado', true)} disabled={isSaving} className={secondaryButton}>
            <Send size={18} strokeWidth={1.75} aria-hidden="true" />
            Publicar ahora
          </button>
          <button type="button" onClick={() => void save('programado')} disabled={isSaving} className={primaryButton}>
            {isSaving ? 'Guardando...' : 'Programar'}
          </button>
        </div>
      </div>
    </div>
  );
}
