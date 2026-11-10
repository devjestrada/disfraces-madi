import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Pause, Play, Sparkles, X } from 'lucide-react';
import type { AdminCategory, AdminCostume } from '../../../types';
import {
  createCampaign,
  createInstagramPost,
  fetchCampaigns,
  fetchCostumeGalleries,
  fetchCostumeSizeKinds,
  fetchPrimaryAltTexts,
  formatBogota,
  generateInstagramCaption,
  itemImageUrl,
  POST_STATUS_LABELS,
  setCampaignStatus,
  type CostumeGallery,
  type InstagramCampaign,
  type InstagramPostStatus,
} from '../../../services/instagramService';
import {
  planCampaign,
  planPerCostume,
  type CampaignGrouping,
  type PerCostumeOrder,
  type PlannerCostume,
  type PlannerResult,
} from '../../../utils/campaignPlanner';
import { FeedPreview, ghostButton, inputClass, labelClass, primaryButton, secondaryButton } from './shared';

const WEEKDAYS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const CARNIVAL_2027 = { bando: '2027-01-16', carnival: '2027-02-06' };

type WizardGrouping = CampaignGrouping | 'por_disfraz';

interface CampaignsPanelProps {
  costumes: AdminCostume[];
  categories: AdminCategory[];
  userId: string | null;
  onOpenCostume: (costumeId: string) => void;
  onCreated: () => void;
  onNotify: (text: string) => void;
  onError: (error: unknown) => void;
  requestConfirm: (options: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
}

function todayBogota() {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function CampaignsPanel({ costumes, categories, userId, onOpenCostume, onCreated, onNotify, onError, requestConfirm }: CampaignsPanelProps) {
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setCampaigns(await fetchCampaigns());
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeStatus = (campaign: InstagramCampaign, status: 'activa' | 'pausada' | 'cancelada') => {
    const apply = async () => {
      try {
        await setCampaignStatus(campaign.id, status);
        onNotify(
          status === 'pausada'
            ? 'Campaña en pausa: sus carruseles no se publicarán hasta reanudarla.'
            : status === 'activa'
              ? 'Campaña reanudada. Lo que venció durante la pausa quedó pendiente para reprogramar.'
              : 'Campaña cancelada. Lo ya publicado se mantiene en Instagram.'
        );
        void load();
        onCreated();
      } catch (error) {
        onError(error);
      }
    };
    if (status === 'cancelada') {
      requestConfirm({
        title: `¿Cancelar "${campaign.name}"?`,
        message: 'Se cancelan todos sus carruseles que aún no se han publicado. Lo publicado se mantiene.',
        confirmLabel: 'Cancelar campaña',
        onConfirm: () => void apply(),
      });
    } else {
      void apply();
    }
  };

  if (isCreating) {
    return (
      <CampaignWizard
        costumes={costumes}
        categories={categories}
        userId={userId}
        onOpenCostume={onOpenCostume}
        onCancel={() => setIsCreating(false)}
        onDone={(message) => {
          setIsCreating(false);
          onNotify(message);
          void load();
          onCreated();
        }}
        onError={onError}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-[1.6] text-[#5C5257]">
          Planea de una vez muchos carruseles. Por ejemplo, mostrar todo el catálogo antes del Carnaval 2027 (6 al 9 de febrero).
        </p>
        <button type="button" onClick={() => setIsCreating(true)} className={primaryButton}>
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" />
          Nueva campaña
        </button>
      </div>
      {isLoading ? <p className="text-sm text-[#5C5257]">Cargando campañas...</p> : null}
      {!isLoading && campaigns.length === 0 ? (
        <p className="rounded-2xl border border-[#1A1418]/10 bg-white p-6 text-sm text-[#5C5257]">Aún no hay campañas.</p>
      ) : null}
      <ul className="space-y-3">
        {campaigns.map((campaign) => (
          <li key={campaign.id} className="space-y-3 rounded-2xl border border-[#1A1418]/10 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-[22px] font-semibold text-[#1A1418]">{campaign.name}</h3>
                <p className="font-mono text-xs text-[#5C5257]">
                  {campaign.start_date} → {campaign.end_date} · {campaign.publish_time.slice(0, 5)} ·{' '}
                  {campaign.grouping === 'por_disfraz' ? 'un disfraz por carrusel' : `${campaign.items_per_post} por carrusel`}
                </p>
              </div>
              <span className="rounded-full bg-[#1A1418]/5 px-3 py-1 text-xs font-medium capitalize text-[#1A1418]">{campaign.status}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(Object.entries(campaign.counts) as Array<[InstagramPostStatus, number]>).map(([status, count]) => (
                <span key={status} className="rounded-full border border-[#1A1418]/15 px-2.5 py-0.5 text-[#1A1418]">
                  {POST_STATUS_LABELS[status]}: <span className="font-mono">{count}</span>
                </span>
              ))}
            </div>
            {campaign.state?.sin_fecha?.length ? (
              <details className="rounded-lg bg-[#FED968] p-3 text-sm text-[#1A1418]">
                <summary className="cursor-pointer font-medium">
                  {campaign.state.sin_fecha.length === 1
                    ? '1 disfraz sin fecha disponible'
                    : `${campaign.state.sin_fecha.length} disfraces sin fecha disponible`}
                </summary>
                <p className="mt-1">
                  Se completaron o agregaron durante la campaña y ya no quedan fechas libres antes del {campaign.end_date}:{' '}
                  {campaign.state.sin_fecha.map((entry) => entry.name).join(', ')}.
                </p>
              </details>
            ) : null}
            {['activa', 'pausada'].includes(campaign.status) ? (
              <div className="flex flex-wrap gap-2">
                {campaign.status === 'activa' ? (
                  <button type="button" onClick={() => changeStatus(campaign, 'pausada')} className={secondaryButton}>
                    <Pause size={18} strokeWidth={1.75} aria-hidden="true" />
                    Pausar
                  </button>
                ) : (
                  <button type="button" onClick={() => changeStatus(campaign, 'activa')} className={secondaryButton}>
                    <Play size={18} strokeWidth={1.75} aria-hidden="true" />
                    Reanudar
                  </button>
                )}
                <button type="button" onClick={() => changeStatus(campaign, 'cancelada')} className={ghostButton}>
                  Cancelar campaña
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

interface WizardProps {
  costumes: AdminCostume[];
  categories: AdminCategory[];
  userId: string | null;
  onOpenCostume: (costumeId: string) => void;
  onCancel: () => void;
  onDone: (message: string) => void;
  onError: (error: unknown) => void;
}

function CampaignWizard({ costumes, categories, userId, onOpenCostume, onCancel, onDone, onError }: WizardProps) {
  const [name, setName] = useState('Todo el catálogo antes del Carnaval 2027');
  const [startDate, setStartDate] = useState(todayBogota());
  const [endDate, setEndDate] = useState('2027-01-31');
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [time, setTime] = useState('19:00');
  const [itemsPerPost, setItemsPerPost] = useState(5);
  const [grouping, setGrouping] = useState<WizardGrouping>('por_disfraz');
  const [postOrder, setPostOrder] = useState<PerCostumeOrder>('destacados_primero');
  const [galleries, setGalleries] = useState<Map<string, CostumeGallery>>(new Map());
  const perCostume = grouping === 'por_disfraz';
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [kind, setKind] = useState<'todos' | 'adulto' | 'nino'>('todos');
  const [excluded, setExcluded] = useState<string[]>([]);
  const [useBando, setUseBando] = useState(true);
  const [useCountdown, setUseCountdown] = useState(true);
  const [fillWithFeatured, setFillWithFeatured] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [includeNew, setIncludeNew] = useState(true);
  const [generateCaptions, setGenerateCaptions] = useState(true);
  const [sizeKinds, setSizeKinds] = useState<Map<string, { adult: boolean; child: boolean }>>(new Map());
  const [plan, setPlan] = useState<PlannerResult | null>(null);
  const [progress, setProgress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCostumeSizeKinds().then(setSizeKinds).catch(() => setSizeKinds(new Map()));
  }, []);

  const eligible = useMemo(
    () =>
      costumes.filter((costume) => {
        if (!costume.is_available || !costume.primary_image) return false;
        // Un carrusel necesita al menos 2 imágenes: en "un disfraz por carrusel" se usan las fotos del disfraz.
        if (perCostume && (costume.image_count ?? 0) < 2) return false;
        if (categoryIds.length && !categoryIds.includes(costume.category_id)) return false;
        if (onlyFeatured && !costume.featured) return false;
        if (kind !== 'todos') {
          const sizes = sizeKinds.get(costume.id);
          if (!sizes) return false;
          if (kind === 'adulto' && !sizes.adult) return false;
          if (kind === 'nino' && !sizes.child) return false;
        }
        return true;
      }),
    [costumes, categoryIds, onlyFeatured, kind, sizeKinds, perCostume]
  );
  const included = eligible.filter((costume) => !excluded.includes(costume.id));
  const withoutPhoto = costumes.filter((costume) => costume.is_available && !costume.primary_image);
  const singlePhoto = perCostume
    ? costumes.filter((costume) => costume.is_available && costume.primary_image && (costume.image_count ?? 0) === 1)
    : [];
  const costumeById = useMemo(() => new Map(costumes.map((costume) => [costume.id, costume])), [costumes]);

  useEffect(() => {
    setPlan(null);
  }, [startDate, endDate, weekdays, time, itemsPerPost, grouping, postOrder, categoryIds, onlyFeatured, kind, excluded, useBando, useCountdown, fillWithFeatured, name]);

  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = async () => {
    const plannerCostumes: PlannerCostume[] = included.map((costume) => ({
      id: costume.id,
      name: costume.name,
      category: costume.category_name ?? 'Sin categoría',
      featured: costume.featured,
    }));
    const milestones = {
      bando: useBando ? CARNIVAL_2027.bando : null,
      carnival: useCountdown ? CARNIVAL_2027.carnival : null,
      countdownFrom: useCountdown ? CARNIVAL_2027.bando : null,
    };
    if (!perCostume) {
      setPlan(
        planCampaign({
          costumes: plannerCostumes,
          startDate,
          endDate,
          weekdays,
          time,
          itemsPerPost,
          grouping: grouping as CampaignGrouping,
          fillWithFeatured,
          campaignName: name.trim() || 'Campaña',
          milestones,
          now: new Date(),
        })
      );
      return;
    }
    setIsCalculating(true);
    try {
      // Las fotos de cada disfraz se leen al calcular, para mostrarlas en el plan y crear los carruseles con ellas.
      setGalleries(await fetchCostumeGalleries(plannerCostumes.map((costume) => costume.id)));
      setPlan(
        planPerCostume({
          costumes: plannerCostumes,
          startDate,
          endDate,
          weekdays,
          time,
          order: postOrder,
          campaignName: name.trim() || 'Campaña',
          milestones,
          now: new Date(),
        })
      );
    } catch (error) {
      onError(error);
    } finally {
      setIsCalculating(false);
    }
  };

  const confirm = async () => {
    if (!plan?.feasible || !plan.posts.length) return;
    setIsSaving(true);
    try {
      const campaignId = await createCampaign(
        {
          name: name.trim() || 'Campaña',
          start_date: startDate,
          end_date: endDate,
          weekdays,
          publish_time: `${time}:00`,
          items_per_post: perCostume ? null : itemsPerPost,
          grouping,
          post_order: postOrder,
          filters: { categoryIds, onlyFeatured, kind, excluded },
          milestones: { bando: useBando ? CARNIVAL_2027.bando : null, carnival: useCountdown ? CARNIVAL_2027.carnival : null },
          requires_approval: requiresApproval,
          include_new_costumes: includeNew,
        },
        userId
      );
      const alts = await fetchPrimaryAltTexts(Array.from(new Set(plan.posts.flatMap((post) => post.costumeIds))));
      let failedCaptions = 0;
      const skipped: string[] = [];
      for (let index = 0; index < plan.posts.length; index += 1) {
        const planned = plan.posts[index];
        const gallery = perCostume ? galleries.get(planned.costumeIds[0]) : undefined;
        if (perCostume && (!gallery || gallery.items.length < 2)) {
          // La galería cambió después de calcular el plan: no se crea un carrusel inválido.
          skipped.push(planned.label);
          continue;
        }
        setProgress(`Creando carrusel ${index + 1} de ${plan.posts.length}${generateCaptions ? ' (escribiendo el texto con IA)' : ''}...`);
        let caption = '';
        if (generateCaptions) {
          try {
            caption = await generateInstagramCaption(planned.costumeIds, planned.theme);
          } catch {
            failedCaptions += 1;
          }
        }
        const status: InstagramPostStatus = !caption ? 'borrador' : requiresApproval ? 'pendiente' : 'programado';
        await createInstagramPost(
          {
            title: `${name.trim() || 'Campaña'} · ${planned.label}`,
            caption,
            scheduled_at: planned.scheduledAt,
            status,
            source: 'campana',
            campaign_id: campaignId,
            items: gallery ? gallery.items : planned.costumeIds.map((costumeId, position) => ({
              position,
              costume_id: costumeId,
              source_bucket: 'costume-images',
              source_path: costumeById.get(costumeId)!.primary_image!,
              alt_text: alts.get(costumeId) ?? null,
            })),
          },
          userId
        );
      }
      onDone(
        `Campaña creada con ${plan.posts.length - skipped.length} carruseles.` +
          (skipped.length ? ` No se crearon ${skipped.length} porque sus fotos cambiaron (${skipped.join(', ')}).` : '') +
          (requiresApproval ? ' Revísalos y apruébalos en el calendario.' : '') +
          (failedCaptions ? ` ${failedCaptions} quedaron como borrador porque no se pudo escribir su texto.` : '')
      );
    } catch (error) {
      onError(error);
    } finally {
      setIsSaving(false);
      setProgress('');
    }
  };

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const chip = (active: boolean) =>
    `min-h-10 rounded-full border px-3 text-sm font-medium ${active ? 'border-[#A8001A] bg-[#A8001A] text-[#FFF8F5]' : 'border-[#1A1418]/20 bg-white text-[#1A1418]'}`;

  return (
    <div className="space-y-5 rounded-2xl border border-[#1A1418]/10 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-[28px] font-semibold leading-[1.25] text-[#1A1418]">Nueva campaña</h3>
        <button type="button" onClick={onCancel} disabled={isSaving} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-lg text-[#5C5257] hover:text-[#A8001A]">
          <X size={22} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={`${labelClass} md:col-span-2`}>
          Nombre
          <input value={name} onChange={(event) => setName(event.target.value)} className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className={labelClass}>
          Desde
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`mt-1.5 font-mono ${inputClass}`} />
        </label>
        <label className={labelClass}>
          Hasta
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`mt-1.5 font-mono ${inputClass}`} />
        </label>
        <fieldset className="md:col-span-2">
          <legend className={labelClass}>Días de publicación</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button key={day.value} type="button" aria-pressed={weekdays.includes(day.value)} onClick={() => setWeekdays((prev) => toggle(prev, day.value))} className={chip(weekdays.includes(day.value))}>
                {day.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={labelClass}>
          Hora (Colombia)
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={`mt-1.5 font-mono ${inputClass}`} />
        </label>
        {perCostume ? (
          <label className={labelClass}>
            Orden de publicación
            <select value={postOrder} onChange={(event) => setPostOrder(event.target.value as PerCostumeOrder)} className={`mt-1.5 ${inputClass}`}>
              <option value="destacados_primero">Destacados primero, alternando categorías</option>
              <option value="alternando">Alternando categorías</option>
            </select>
          </label>
        ) : (
          <label className={labelClass}>
            Disfraces por carrusel
            <input type="number" min={2} max={10} value={itemsPerPost} onChange={(event) => setItemsPerPost(Math.min(10, Math.max(2, Number(event.target.value) || 2)))} className={`mt-1.5 font-mono ${inputClass}`} />
          </label>
        )}
        <label className={`${labelClass} md:col-span-2`}>
          Cómo agrupar
          <select value={grouping} onChange={(event) => setGrouping(event.target.value as WizardGrouping)} className={`mt-1.5 ${inputClass}`}>
            <option value="por_disfraz">Un disfraz por carrusel (todas sus fotos)</option>
            <option value="categoria">Varios por carrusel, por categoría</option>
            <option value="mezclado">Varios por carrusel, mezclados</option>
            <option value="destacados_primero">Varios por carrusel, destacados primero</option>
          </select>
        </label>
      </div>

      <fieldset className="space-y-3 border-t border-[#1A1418]/10 pt-4">
        <legend className="text-xs font-medium uppercase tracking-wide text-[#5C5257]">Qué disfraces entran</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!categoryIds.length} onClick={() => setCategoryIds([])} className={chip(!categoryIds.length)}>Todas las categorías</button>
          {categories.map((category) => (
            <button key={category.id} type="button" aria-pressed={categoryIds.includes(category.id)} onClick={() => setCategoryIds((prev) => toggle(prev, category.id))} className={chip(categoryIds.includes(category.id))}>
              {category.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['todos', 'adulto', 'nino'] as const).map((option) => (
            <button key={option} type="button" aria-pressed={kind === option} onClick={() => setKind(option)} className={chip(kind === option)}>
              {option === 'todos' ? 'Adulto y niño' : option === 'adulto' ? 'Solo adulto' : 'Solo niño'}
            </button>
          ))}
          <button type="button" aria-pressed={onlyFeatured} onClick={() => setOnlyFeatured((value) => !value)} className={chip(onlyFeatured)}>Solo destacados</button>
        </div>
        <details>
          <summary className="cursor-pointer text-sm font-medium text-[#1A1418]">
            Incluidos: <span className="font-mono">{included.length}</span> disfraces disponibles{' '}
            {perCostume ? 'con 2 o más fotos' : 'con foto'}
            {excluded.length ? ` (${excluded.length} excluidos a mano)` : ''} — tocar para excluir
          </summary>
          <div className="mt-2 grid max-h-64 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">
            {eligible.map((costume) => (
              <label key={costume.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={!excluded.includes(costume.id)} onChange={() => setExcluded((prev) => toggle(prev, costume.id))} className="h-4 w-4 accent-[#A8001A]" />
                <span className="truncate">{costume.name}</span>
              </label>
            ))}
          </div>
        </details>
        {singlePhoto.length ? (
          <details className="rounded-lg border border-[#1A1418]/10 bg-[#FFF8F5] p-3">
            <summary className="cursor-pointer text-sm font-medium text-[#1A1418]">
              Con una sola foto: <span className="font-mono">{singlePhoto.length}</span> no entran (un carrusel necesita al menos 2)
            </summary>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {singlePhoto.map((costume) => (
                <li key={costume.id} className="flex min-h-10 items-center justify-between gap-2 text-sm text-[#1A1418]">
                  <span className="truncate">{costume.name}</span>
                  <button type="button" onClick={() => onOpenCostume(costume.id)} className="shrink-0 text-sm font-medium text-[#A8001A] underline">
                    Abrir
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
        {withoutPhoto.length ? (
          <p className="text-xs text-[#5C5257]">
            Sin fotos (no entran hasta tener {perCostume ? 'al menos 2' : 'una'}): {withoutPhoto.map((costume) => costume.name).join(', ')}.
          </p>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-x-6 gap-y-2 border-t border-[#1A1418]/10 pt-4 md:grid-cols-2">
        <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-[#5C5257]">Opciones</legend>
        {[
          [useBando, setUseBando, 'Mencionar la Lectura del Bando (16 ene 2027)'],
          [useCountdown, setUseCountdown, 'Cuenta regresiva al Carnaval (6–9 feb 2027) desde el Bando'],
          ...(perCostume ? [] : [[fillWithFeatured, setFillWithFeatured, 'Repetir destacados en las fechas que sobren']]),
          [requiresApproval, setRequiresApproval, 'Requiere aprobación antes de publicar (recomendado)'],
          [includeNew, setIncludeNew, 'Sumar los disfraces nuevos que agregues durante la campaña'],
          [generateCaptions, setGenerateCaptions, 'Escribir los textos con IA al crear la campaña'],
        ].map(([value, setter, label]) => (
          <label key={label as string} className="flex min-h-10 items-center gap-2 text-sm text-[#1A1418]">
            <input type="checkbox" checked={value as boolean} onChange={() => (setter as (fn: (v: boolean) => boolean) => void)((v) => !v)} className="h-4 w-4 accent-[#A8001A]" />
            {label as string}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-[#1A1418]/10 pt-4">
        <button type="button" onClick={() => void calculate()} disabled={isSaving || isCalculating || included.length < (perCostume ? 1 : 2)} className={primaryButton}>
          <CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" />
          {isCalculating ? 'Calculando...' : 'Calcular plan'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={ghostButton}>Cancelar</button>
      </div>

      {plan ? (
        <section aria-labelledby="plan-titulo" className="space-y-3 rounded-xl bg-[#FFF8F5] p-4">
          <h4 id="plan-titulo" className="font-serif text-[22px] font-semibold text-[#1A1418]">
            {plan.feasible ? `Plan: ${plan.posts.length} carruseles` : 'El plan no cabe en esas fechas'}
          </h4>
          <p className="text-sm text-[#5C5257]">
            Fechas disponibles: <span className="font-mono">{plan.slotsAvailable}</span> · carruseles necesarios para mostrar todo:{' '}
            <span className="font-mono">{plan.postsNeeded}</span>
          </p>
          {plan.suggestions.length ? (
            <ul className={`list-disc space-y-1 rounded-lg p-3 pl-6 text-sm ${plan.feasible ? 'bg-white text-[#1A1418]' : 'border border-[#F3C9C5] bg-[#FDECEA] text-[#8C1D18]'}`}>
              {plan.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
            </ul>
          ) : null}
          {plan.feasible ? (
            <>
              <ol className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
                {plan.posts.map((post, index) => (
                  <li key={`${post.date}-${index}`} className="rounded-lg border border-[#1A1418]/10 bg-white p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-xs text-[#5C5257]">{formatBogota(post.scheduledAt)}</span>
                      <span className="text-sm font-medium text-[#1A1418]">{post.label}</span>
                    </div>
                    {perCostume ? (
                      (() => {
                        const gallery = galleries.get(post.costumeIds[0]);
                        return (
                          <>
                            <div className="mt-2 flex gap-1 overflow-x-auto">
                              {(gallery?.items ?? []).map((item) => (
                                <FeedPreview key={item.source_path} src={itemImageUrl(item)} alt={item.alt_text ?? post.label} className="w-14 shrink-0" />
                              ))}
                            </div>
                            <p className="mt-1 text-xs text-[#5C5257]">
                              <span className="font-mono">{gallery?.items.length ?? 0}</span> fotos en el carrusel
                              {gallery?.leftOut ? ` · ${gallery.leftOut} quedan fuera (máximo 10)` : ''}
                            </p>
                          </>
                        );
                      })()
                    ) : (
                    <div className="mt-2 flex gap-1 overflow-x-auto">
                      {post.costumeIds.map((id) => {
                        const costume = costumeById.get(id);
                        return costume?.primary_image ? (
                          <FeedPreview key={id} src={itemImageUrl({ source_bucket: 'costume-images', source_path: costume.primary_image })} alt={costume.name} className="w-14 shrink-0" />
                        ) : null;
                      })}
                    </div>
                    )}
                    {post.theme.includes('. ') ? (
                      <p className="mt-2 text-xs text-[#5C5257]">Hito: {post.theme.split('. ').slice(1).join(' · ')}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
              {progress ? <p role="status" className="text-sm font-medium text-[#1A1418]">{progress}</p> : null}
              <button type="button" onClick={() => void confirm()} disabled={isSaving} className={primaryButton}>
                <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
                {isSaving ? 'Creando...' : `Crear campaña con ${plan.posts.length} carruseles`}
              </button>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
