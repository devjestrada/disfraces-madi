import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, RefreshCw, X } from 'lucide-react';
import { editCostumePhoto, extractCostumeData, type AiCostumeDraft } from '../../services/aiCostumeService';
import { prepareImageForAi } from '../../utils/imageOptimization';

/** 1 edición inicial + 3 regeneraciones (spec crear_disfraz_desde_foto). */
const MAX_EDITS_PER_PHOTO = 4;

type Step = 'foto' | 'editar' | 'descripcion';

interface CrearDesdeFotoProps {
  onCancel: () => void;
  onComplete: (draft: AiCostumeDraft) => void;
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'foto', label: 'Foto' },
  { id: 'editar', label: 'Edición' },
  { id: 'descripcion', label: 'Descripción' },
];

export default function CrearDesdeFoto({ onCancel, onComplete }: CrearDesdeFotoProps) {
  const [step, setStep] = useState<Step>('foto');
  const [original, setOriginal] = useState<File | null>(null);
  const [edited, setEdited] = useState<File | null>(null);
  const [editsDone, setEditsDone] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [description, setDescription] = useState('');
  const isMounted = useRef(true);

  const originalUrl = useObjectUrl(original);
  const editedUrl = useObjectUrl(edited);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isEditing && !isExtracting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isEditing, isExtracting]);

  const runEdit = async (photo: File) => {
    setIsEditing(true);
    setError('');
    setShowOriginal(false);
    try {
      const result = await editCostumePhoto(photo);
      if (!isMounted.current) return;
      setEdited(result);
      setEditsDone((count) => count + 1);
    } catch (editError) {
      if (!isMounted.current) return;
      setError(editError instanceof Error ? editError.message : String(editError));
    } finally {
      if (isMounted.current) setIsEditing(false);
    }
  };

  const handleSelectPhoto = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setIsPreparing(true);
    setError('');
    try {
      const prepared = await prepareImageForAi(file);
      setOriginal(prepared);
      setEdited(null);
      setEditsDone(0);
      setStep('editar');
      void runEdit(prepared);
    } catch {
      setError('No pudimos leer esa foto. Intenta con otra o tómala de nuevo.');
    } finally {
      setIsPreparing(false);
    }
  };

  const restart = () => {
    setOriginal(null);
    setEdited(null);
    setEditsDone(0);
    setError('');
    setStep('foto');
  };

  const handleExtract = async () => {
    if (!edited) return;
    setIsExtracting(true);
    setError('');
    try {
      const extracted = await extractCostumeData(description);
      if (!isMounted.current) return;
      onComplete({ photo: edited, altText: extracted.texto_alternativo, extracted });
    } catch (extractError) {
      if (!isMounted.current) return;
      setError(extractError instanceof Error ? extractError.message : String(extractError));
    } finally {
      if (isMounted.current) setIsExtracting(false);
    }
  };

  const regenerationsLeft = Math.max(0, MAX_EDITS_PER_PHOTO - editsDone);
  const currentIndex = STEPS.findIndex((item) => item.id === step);
  const isBusy = isPreparing || isEditing || isExtracting;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#FFF8F5]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desde-foto-titulo"
    >
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pb-8 pt-4 sm:pt-8">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="desde-foto-titulo" className="font-serif text-[28px] font-semibold leading-[1.25] text-[#1A1418]">
              Nuevo disfraz desde foto
            </h2>
            <ol className="mt-3 flex gap-2" aria-label="Pasos">
              {STEPS.map((item, index) => (
                <li
                  key={item.id}
                  aria-current={item.id === step ? 'step' : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    index === currentIndex
                      ? 'bg-[#A8001A] text-[#FFF8F5]'
                      : index < currentIndex
                        ? 'bg-[#1A1418]/10 text-[#1A1418]'
                        : 'border border-[#1A1418]/15 text-[#5C5257]'
                  }`}
                >
                  <span className="font-mono">{index + 1}</span>
                  {item.label}
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isEditing || isExtracting}
            aria-label="Cancelar y cerrar"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#5C5257] transition-colors duration-150 ease-out hover:text-[#A8001A] disabled:opacity-40"
          >
            <X size={22} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </header>

        {error ? (
          <div role="alert" className="mt-5 rounded-xl border border-[#B3261E]/30 bg-[#FDECEA] p-4 text-sm font-medium text-[#8C1D18]">
            {error}
          </div>
        ) : null}

        {step === 'foto' ? (
          <section className="mt-6 space-y-4" aria-label="Elegir foto">
            <p className="text-base leading-[1.7] text-[#1A1418]">
              Toma la foto del disfraz o elígela de tu galería. La IA la deja con el fondo de estudio del catálogo.
            </p>
            <label
              className={`flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#A8001A] px-5 text-base font-medium text-[#FFF8F5] transition-colors duration-150 ease-out hover:bg-[#860015] ${
                isBusy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <Camera size={24} strokeWidth={1.75} aria-hidden="true" />
              Tomar foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                disabled={isBusy}
                onChange={(event) => {
                  void handleSelectPhoto(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            <label
              className={`flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#A8001A] bg-white px-5 text-base font-medium text-[#A8001A] ${
                isBusy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <ImagePlus size={24} strokeWidth={1.75} aria-hidden="true" />
              Elegir de la galería
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isBusy}
                onChange={(event) => {
                  void handleSelectPhoto(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {isPreparing ? <p className="text-sm text-[#5C5257]">Preparando la foto...</p> : null}
            <p className="text-xs font-medium leading-[1.5] text-[#5C5257]">
              Consejo: toma la foto de cuerpo entero, con buena luz y sin cortar el tocado ni el calzado.
            </p>
          </section>
        ) : null}

        {step === 'editar' ? (
          <section className="mt-6 space-y-4" aria-label="Edición de la foto" aria-busy={isEditing}>
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-[#1A1418]/10 bg-[#E8E8E8]">
              {(showOriginal || !editedUrl) && originalUrl ? (
                <img src={originalUrl} alt="Foto original del disfraz" className="h-full w-full object-contain" />
              ) : null}
              {!showOriginal && editedUrl ? (
                <img src={editedUrl} alt="Foto del disfraz editada con fondo de estudio" className="h-full w-full object-contain" />
              ) : null}
              {isEditing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#FFF8F5]/85 px-6 text-center">
                  <RefreshCw size={28} strokeWidth={1.75} aria-hidden="true" className="animate-spin text-[#A8001A]" />
                  <p className="text-base font-medium text-[#1A1418]">Estamos dejando tu foto lista para el catálogo...</p>
                  <p className="text-sm text-[#5C5257]">Puede tardar hasta un par de minutos. No cierres esta pantalla.</p>
                </div>
              ) : null}
            </div>

            {edited && !isEditing ? (
              <>
                <div role="group" aria-label="Ver foto" className="mx-auto flex w-fit rounded-lg border border-[#1A1418]/20 p-1">
                  {[
                    { label: 'Editada', value: false },
                    { label: 'Original', value: true },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={showOriginal === option.value}
                      onClick={() => setShowOriginal(option.value)}
                      className={`min-h-10 rounded-md px-4 text-sm font-medium ${
                        showOriginal === option.value ? 'bg-[#A8001A] text-[#FFF8F5]' : 'text-[#1A1418]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('descripcion');
                  }}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A8001A] text-base font-medium text-[#FFF8F5] transition-colors duration-150 ease-out hover:bg-[#860015]"
                >
                  <Check size={20} strokeWidth={1.75} aria-hidden="true" />
                  Usar esta foto
                </button>
                {regenerationsLeft > 0 ? (
                  <button
                    type="button"
                    onClick={() => original && void runEdit(original)}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#1A1418]/20 bg-white text-base font-medium text-[#1A1418]"
                  >
                    <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
                    Regenerar ({regenerationsLeft} {regenerationsLeft === 1 ? 'intento' : 'intentos'})
                  </button>
                ) : (
                  <p className="text-center text-sm leading-[1.6] text-[#5C5257]">
                    Ya regeneraste 3 veces. Si todavía no te convence, prueba con otra foto.
                  </p>
                )}
              </>
            ) : null}

            {!isEditing && (!edited || error) ? (
              <div className="flex flex-col gap-3">
                {!edited && original ? (
                  <button
                    type="button"
                    onClick={() => void runEdit(original)}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A8001A] text-base font-medium text-[#FFF8F5]"
                  >
                    <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" />
                    Intentar de nuevo
                  </button>
                ) : null}
              </div>
            ) : null}

            {!isEditing ? (
              <button
                type="button"
                onClick={restart}
                className="flex min-h-11 w-full items-center justify-center text-sm font-medium text-[#A8001A]"
              >
                Usar otra foto
              </button>
            ) : null}
          </section>
        ) : null}

        {step === 'descripcion' ? (
          <section className="mt-6 space-y-4" aria-label="Descripción del disfraz" aria-busy={isExtracting}>
            <div className="flex items-center gap-4">
              {editedUrl ? (
                <img
                  src={editedUrl}
                  alt="Foto del disfraz editada"
                  className="h-28 w-21 shrink-0 rounded-lg border border-[#1A1418]/10 object-cover"
                />
              ) : null}
              <p className="text-sm leading-[1.6] text-[#5C5257]">
                Cuéntanos del disfraz con tus palabras: nombre, categoría, telas, accesorios, tallas y precios de alquiler,
                venta y depósito. Toca el micrófono del teclado para dictar.
              </p>
            </div>
            <label className="block text-sm font-medium text-[#1A1418]" htmlFor="desde-foto-descripcion">
              Descripción del disfraz
            </label>
            <textarea
              id="desde-foto-descripcion"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={isExtracting}
              rows={7}
              maxLength={5000}
              placeholder="Ej.: Marimonda para adulto, tallas M y L, con máscara tallada y sombrilla. Alquiler 60 mil, depósito 50 mil."
              className="w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 py-2.5 text-base leading-[1.7] text-[#1A1418] outline-none focus:border-[#A8001A] disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleExtract()}
              disabled={isExtracting || !description.trim()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#A8001A] text-base font-medium text-[#FFF8F5] transition-colors duration-150 ease-out hover:bg-[#860015] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <RefreshCw size={20} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
                  Llenando el formulario...
                </>
              ) : (
                'Prellenar con IA'
              )}
            </button>
            <button
              type="button"
              disabled={isExtracting}
              onClick={() => edited && onComplete({ photo: edited, altText: '', extracted: null })}
              className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[#1A1418]/20 bg-white text-sm font-medium text-[#1A1418] disabled:opacity-50"
            >
              Omitir y llenar a mano
            </button>
            <button
              type="button"
              disabled={isExtracting}
              onClick={() => setStep('editar')}
              className="flex min-h-11 w-full items-center justify-center text-sm font-medium text-[#A8001A] disabled:opacity-50"
            >
              Volver a la foto
            </button>
          </section>
        ) : null}
      </div>
    </div>
  );
}
