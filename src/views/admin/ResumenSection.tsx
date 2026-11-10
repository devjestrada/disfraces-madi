import { useEffect, useMemo, useState } from 'react';
import { Camera, ChevronRight, Plus } from 'lucide-react';
import PeriodSelector from '../../components/admin/insights/PeriodSelector';
import KpiCard from '../../components/admin/insights/KpiCard';
import TopRankingCard, { type RankingRow } from '../../components/admin/insights/TopRankingCard';
import {
  aggregateEventCounts,
  countEvents,
  fetchCostumeEvents,
  getFullClickTrackingSince,
  fetchRentalHistory,
  filterRentalHistoryByRange,
  rankRentalsByCostume,
  type CostumeEventRow,
} from '../../services/insightsService';
import { fetchCatalogImageHealth, type CatalogImageHealth } from '../../services/adminService';
import {
  fetchAttentionPosts,
  fetchInstagramConnection,
  type InstagramConnection,
  type InstagramPost,
} from '../../services/instagramService';
import { getPeriodRange, getPreviousEquivalentRange, percentChange } from '../../utils/dateRanges';
import type { AdminCostume, AdminRentalHistoryRow, DateRange, InsightsPeriodPreset } from '../../types';

interface ResumenSectionProps {
  costumes: AdminCostume[];
  onCreateNew: () => void;
  onCreateFromPhoto: () => void;
  onOpenCostume: (costumeId: string) => void;
  onGoToInsights: () => void;
  onGoToCostumes: () => void;
  onGoToInstagram: () => void;
}

interface PendingItem {
  key: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  highlight?: boolean;
}

export default function ResumenSection({
  costumes,
  onCreateNew,
  onCreateFromPhoto,
  onOpenCostume,
  onGoToInsights,
  onGoToCostumes,
  onGoToInstagram,
}: ResumenSectionProps) {
  const [period, setPeriod] = useState<InsightsPeriodPreset>('mes');
  const [customRange, setCustomRange] = useState<DateRange>({ from: null, to: null });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [rentalHistory, setRentalHistory] = useState<AdminRentalHistoryRow[]>([]);
  const [viewEvents, setViewEvents] = useState<CostumeEventRow[]>([]);
  const [whatsappEvents, setWhatsappEvents] = useState<CostumeEventRow[]>([]);
  const [imageHealth, setImageHealth] = useState<CatalogImageHealth | null>(null);
  const [instagram, setInstagram] = useState<{ posts: InstagramPost[]; connection: InstagramConnection | null } | null>(null);
  const [eventTotals, setEventTotals] = useState({ viewsNow: 0, viewsPrev: 0, clicksNow: 0, clicksPrev: 0 });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const [rentals, views, clicks, health] = await Promise.all([
          fetchRentalHistory(),
          fetchCostumeEvents('view'),
          fetchCostumeEvents('whatsapp_click'),
          fetchCatalogImageHealth(),
        ]);
        if (!isMounted) {
          return;
        }
        setRentalHistory(rentals);
        setViewEvents(views);
        setWhatsappEvents(clicks);
        setImageHealth(health);
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Avisos de Instagram: aparte, para que un fallo aquí no afecte el resto del resumen.
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchAttentionPosts(), fetchInstagramConnection()])
      .then(([posts, connection]) => {
        if (isMounted) setInstagram({ posts, connection });
      })
      .catch((error) => console.warn('[resumen] avisos de Instagram no disponibles', error));
    return () => {
      isMounted = false;
    };
  }, []);

  const activeRange = useMemo(() => getPeriodRange(period, customRange), [period, customRange]);
  const previousRange = useMemo(() => getPreviousEquivalentRange(period, activeRange), [period, activeRange]);

  // Totales de visitas y clics: conteo exacto en Supabase (no depende de cuántas filas se descarguen).
  useEffect(() => {
    let isMounted = true;
    const loadTotals = async () => {
      try {
        const [viewsNow, viewsPrev, clicksNow, clicksPrev] = await Promise.all([
          countEvents('view', activeRange),
          previousRange ? countEvents('view', previousRange) : Promise.resolve(0),
          countEvents('whatsapp_click', activeRange),
          previousRange ? countEvents('whatsapp_click', previousRange) : Promise.resolve(0),
        ]);
        if (isMounted) {
          setEventTotals({ viewsNow, viewsPrev, clicksNow, clicksPrev });
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      }
    };
    loadTotals();
    return () => {
      isMounted = false;
    };
  }, [activeRange, previousRange]);

  const rentalsInRange = useMemo(
    () => filterRentalHistoryByRange(rentalHistory, activeRange),
    [rentalHistory, activeRange]
  );
  const rentalsPrev = previousRange ? filterRentalHistoryByRange(rentalHistory, previousRange).length : 0;
  const { viewsNow, viewsPrev, clicksNow, clicksPrev } = eventTotals;
  const fullClickTrackingSince = useMemo(() => getFullClickTrackingSince(whatsappEvents), [whatsappEvents]);
  const clicksNote = fullClickTrackingSince
    ? `Medición completa desde el ${fullClickTrackingSince.toLocaleDateString('es-CO')}.`
    : 'Hasta ahora solo se mide el botón de la ficha de disfraz.';

  const variation = (now: number, prev: number) => (previousRange ? percentChange(now, prev) : null);

  const costumeNameById = useMemo(() => new Map(costumes.map((c) => [c.id, c.name])), [costumes]);

  const rentedRows: RankingRow[] = useMemo(
    () =>
      rankRentalsByCostume(rentalsInRange).map((entry) => ({
        costumeId: entry.costumeId,
        label: entry.costumeId
          ? costumeNameById.get(entry.costumeId) ?? 'Disfraz eliminado'
          : 'Histórico sin vincular',
        count: entry.count,
      })),
    [rentalsInRange, costumeNameById]
  );

  const viewedRows: RankingRow[] = useMemo(
    () =>
      aggregateEventCounts(viewEvents, activeRange)
        .sort((a, b) => b.count - a.count)
        .map((entry) => ({
          costumeId: entry.costume_id,
          label: costumeNameById.get(entry.costume_id) ?? 'Disfraz eliminado',
          count: entry.count,
        })),
    [viewEvents, activeRange, costumeNameById]
  );

  const availableCount = costumes.filter((costume) => costume.is_available).length;
  const hiddenCount = costumes.length - availableCount;
  const unlinkedRentals = rentalHistory.filter((row) => !row.matched_costume_id).length;
  const withoutDeposit = costumes.filter((costume) => costume.deposit_price === null);
  const withoutPhotos = imageHealth
    ? costumes.filter((costume) => !imageHealth.costumeIdsWithImages.has(costume.id))
    : [];

  const firstOrList = (list: AdminCostume[]) => () => {
    if (list.length === 1) {
      onOpenCostume(list[0].id);
    } else {
      onGoToCostumes();
    }
  };

  const pending: PendingItem[] = [];
  if (unlinkedRentals > 0) {
    pending.push({
      key: 'unlinked',
      title: `${unlinkedRentals} ${unlinkedRentals === 1 ? 'alquiler sin vincular' : 'alquileres sin vincular'}`,
      description: 'Del histórico importado; no cuentan en los rankings por disfraz.',
      actionLabel: 'Vincular',
      onAction: onGoToInsights,
      highlight: true,
    });
  }
  if (withoutDeposit.length > 0) {
    pending.push({
      key: 'deposit',
      title: `${withoutDeposit.length} ${withoutDeposit.length === 1 ? 'disfraz sin depósito' : 'disfraces sin depósito'}`,
      description: 'El depósito reembolsable debe publicarse junto al precio.',
      actionLabel: withoutDeposit.length === 1 ? 'Completar' : 'Ver disfraces',
      onAction: firstOrList(withoutDeposit),
    });
  }
  if (withoutPhotos.length > 0) {
    pending.push({
      key: 'photos',
      title: `${withoutPhotos.length} ${withoutPhotos.length === 1 ? 'disfraz sin fotos' : 'disfraces sin fotos'}`,
      description: 'Sin foto no se ve bien en el catálogo.',
      actionLabel: withoutPhotos.length === 1 ? 'Subir fotos' : 'Ver disfraces',
      onAction: firstOrList(withoutPhotos),
    });
  }
  if (instagram) {
    const failed = instagram.posts.filter((post) => post.status === 'fallido').length;
    const toApprove = instagram.posts.filter((post) => post.status === 'pendiente').length;
    const connection = instagram.connection;
    if (connection?.last_error) {
      pending.push({
        key: 'instagram-token',
        title: 'La conexión con Instagram necesita atención',
        description: 'Mientras no se reconecte, no se publica ningún carrusel.',
        actionLabel: 'Revisar',
        onAction: onGoToInstagram,
        highlight: true,
      });
    }
    if (toApprove > 0) {
      pending.push({
        key: 'instagram-approve',
        title: `${toApprove} ${toApprove === 1 ? 'carrusel por aprobar' : 'carruseles por aprobar'} en las próximas 48 h`,
        description: 'Si nadie los aprueba antes de su hora, no se publican en Instagram.',
        actionLabel: 'Revisar',
        onAction: onGoToInstagram,
        highlight: true,
      });
    }
    if (failed > 0) {
      pending.push({
        key: 'instagram-failed',
        title: `${failed} ${failed === 1 ? 'carrusel de Instagram falló' : 'carruseles de Instagram fallaron'}`,
        description: 'Revisa el motivo y reintenta desde el calendario.',
        actionLabel: 'Ver',
        onAction: onGoToInstagram,
      });
    }
  }
  const singlePhoto = costumes.filter((costume) => costume.is_available && costume.image_count === 1);
  if (singlePhoto.length > 0) {
    pending.push({
      key: 'single-photo',
      title: `${singlePhoto.length} ${singlePhoto.length === 1 ? 'disfraz con una sola foto' : 'disfraces con una sola foto'}`,
      description: 'No entran en las campañas de Instagram de un disfraz por carrusel (se necesitan al menos 2).',
      actionLabel: singlePhoto.length === 1 ? 'Subir fotos' : 'Ver disfraces',
      onAction: firstOrList(singlePhoto),
    });
  }
  if (imageHealth && imageHealth.imagesWithoutAlt > 0) {
    pending.push({
      key: 'alt',
      title: `${imageHealth.imagesWithoutAlt} ${imageHealth.imagesWithoutAlt === 1 ? 'foto sin texto alternativo' : 'fotos sin texto alternativo'}`,
      description: 'Ayuda al SEO y a quienes usan lector de pantalla.',
      actionLabel: 'Ver disfraces',
      onAction: onGoToCostumes,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl font-bold leading-[1.2] text-[#1A1418]">Resumen</h2>
          <p className="mt-1 text-sm leading-[1.6] text-[#5C5257]">Cómo va el catálogo y qué tienes pendiente.</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCreateFromPhoto}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#A8001A] bg-white px-5 text-[15px] font-medium text-[#A8001A]"
        >
          <Camera size={20} strokeWidth={1.75} aria-hidden="true" />
          Desde foto
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#A8001A] px-5 text-[15px] font-medium text-[#FFF8F5] transition-colors duration-150 ease-out hover:bg-[#860015]"
        >
          <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
          Nuevo disfraz
        </button>
        </div>
      </div>

      <PeriodSelector
        value={period}
        customRange={customRange}
        onChange={setPeriod}
        onCustomRangeChange={setCustomRange}
      />

      {loadError ? (
        <div role="alert" className="rounded-xl border border-[#F3C9C5] bg-[#FDECEA] p-4 text-sm text-[#8C1D18]">
          Algo no cargó bien en el resumen. Intenta de nuevo en un momento. ({loadError})
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-[#5C5257]">Cargando resumen...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Alquileres en el periodo"
              value={rentalsInRange.length}
              source="Histórico de alquileres"
              variation={variation(rentalsInRange.length, rentalsPrev)}
              isEmpty={rentalsInRange.length === 0}
            />
            <KpiCard
              label="Visitas a fichas"
              value={viewsNow}
              source="Visitas al sitio"
              variation={variation(viewsNow, viewsPrev)}
              isEmpty={viewsNow === 0}
            />
            <KpiCard
              label="Clics a WhatsApp"
              value={clicksNow}
              source="Visitas al sitio"
              variation={variation(clicksNow, clicksPrev)}
              isEmpty={clicksNow === 0}
              note={clicksNote}
            />
            <KpiCard
              label="Disfraces disponibles"
              value={`${availableCount} / ${costumes.length}`}
              source="Catálogo"
              emptyMessage="Aún no hay disfraces en el catálogo."
              isEmpty={costumes.length === 0}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <section
              aria-labelledby="resumen-pendientes"
              className="space-y-3 rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm"
            >
              <h3 id="resumen-pendientes" className="font-serif text-[22px] font-semibold leading-[1.3] text-[#1A1418]">
                Para revisar
              </h3>
              {hiddenCount > 0 ? (
                <p className="text-xs font-medium text-[#5C5257]">
                  {hiddenCount} {hiddenCount === 1 ? 'disfraz oculto' : 'disfraces ocultos'} del catálogo.
                </p>
              ) : null}
              {pending.length === 0 ? (
                <p className="text-sm leading-[1.6] text-[#5C5257]">Todo al día. No hay pendientes en el catálogo.</p>
              ) : (
                <ul className="space-y-2">
                  {pending.map((item) => (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={item.onAction}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left ${
                          item.highlight ? 'bg-[#FED968]' : 'border border-[#1A1418]/10'
                        }`}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-[#1A1418]">{item.title}</span>
                          <span className="block text-sm leading-[1.6] text-[#5C5257]">{item.description}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-[#A8001A]">
                          {item.actionLabel}
                          <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <TopRankingCard
              title="Más alquilados"
              source="Histórico de alquileres"
              rows={rentedRows}
              onViewAll={onGoToInsights}
            />
            <TopRankingCard
              title="Más visualizados"
              source="Visitas al sitio"
              rows={viewedRows}
              onViewAll={onGoToInsights}
            />
          </div>
        </>
      )}
    </div>
  );
}
