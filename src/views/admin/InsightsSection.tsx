import { useEffect, useMemo, useRef, useState } from 'react';
import Toast, { type ToastMessage, type ToastVariant } from '../../components/Toast';
import PeriodSelector from '../../components/admin/insights/PeriodSelector';
import KpiCard from '../../components/admin/insights/KpiCard';
import TopRankingCard, { type RankingRow } from '../../components/admin/insights/TopRankingCard';
import RankingDetailDrawer, {
  type RankingDetailRow,
} from '../../components/admin/insights/RankingDetailDrawer';
import RentalHistoryTable from '../../components/admin/insights/RentalHistoryTable';
import CsvImportPanel from '../../components/admin/insights/CsvImportPanel';
import LinkingUtility from '../../components/admin/insights/LinkingUtility';
import {
  fetchCostumesForMatching,
  fetchRentalHistory,
  fetchCostumeEvents,
  fetchLabelAliases,
  filterRentalHistoryByRange,
  aggregateEventCounts,
  rankRentalsByCostume,
  importRentalHistoryCsv,
  confirmLabelMatch,
  countEvents,
  aggregateClicksBySource,
  getFullClickTrackingSince,
  type MatchableCostume,
} from '../../services/insightsService';
import type {
  AdminRentalHistoryRow,
  AdminCostumeLabelAlias,
  RentalHistoryImportRow,
  InsightsPeriodPreset,
  DateRange,
} from '../../types';
import { getPeriodRange, getPreviousEquivalentRange, percentChange } from '../../utils/dateRanges';
import type { CostumeEventRow } from '../../services/insightsService';

interface InsightsSectionProps {
  onNavigateToCostume: (costumeId: string) => void;
}

export default function InsightsSection({ onNavigateToCostume }: InsightsSectionProps) {
  const [period, setPeriod] = useState<InsightsPeriodPreset>('mes');
  const [customRange, setCustomRange] = useState<DateRange>({ from: null, to: null });

  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [costumes, setCostumes] = useState<MatchableCostume[]>([]);
  const [allRentalHistory, setAllRentalHistory] = useState<AdminRentalHistoryRow[]>([]);
  const [allViewEvents, setAllViewEvents] = useState<CostumeEventRow[]>([]);
  const [allClickEvents, setAllClickEvents] = useState<CostumeEventRow[]>([]);
  const [clickTotals, setClickTotals] = useState({ now: 0, prev: 0 });
  const [aliases, setAliases] = useState<AdminCostumeLabelAlias[]>([]);

  const [drawer, setDrawer] = useState<'alquilados' | 'visualizados' | 'clics' | null>(null);

  const linkingRef = useRef<HTMLDivElement | null>(null);

  const notify = (text: string, variant: ToastVariant = 'success') => setToast({ text, variant });
  const notifyError = (error: unknown) =>
    setToast({ text: error instanceof Error ? error.message : String(error), variant: 'error' });

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [costumesData, rentalData, viewEvents, clickEvents, aliasData] = await Promise.all([
        fetchCostumesForMatching(),
        fetchRentalHistory(),
        fetchCostumeEvents('view'),
        fetchCostumeEvents('whatsapp_click'),
        fetchLabelAliases(),
      ]);
      setCostumes(costumesData);
      setAllRentalHistory(rentalData);
      setAllViewEvents(viewEvents);
      setAllClickEvents(clickEvents);
      setAliases(aliasData);
    } catch (error) {
      notifyError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const costumeNameById = useMemo(() => new Map(costumes.map((c) => [c.id, c.name])), [costumes]);

  const activeRange = useMemo(() => getPeriodRange(period, customRange), [period, customRange]);
  const previousRange = useMemo(
    () => getPreviousEquivalentRange(period, activeRange),
    [period, activeRange]
  );

  const rentalRowsInRange = useMemo(
    () => filterRentalHistoryByRange(allRentalHistory, activeRange),
    [allRentalHistory, activeRange]
  );
  const rentalRowsInPrevRange = useMemo(
    () => (previousRange ? filterRentalHistoryByRange(allRentalHistory, previousRange) : []),
    [allRentalHistory, previousRange]
  );

  const viewCountsInRange = useMemo(
    () => aggregateEventCounts(allViewEvents, activeRange),
    [allViewEvents, activeRange]
  );
  const viewCountsInPrevRange = useMemo(
    () => (previousRange ? aggregateEventCounts(allViewEvents, previousRange) : []),
    [allViewEvents, previousRange]
  );

  const totalRentals = rentalRowsInRange.length;
  const totalRentalsPrev = rentalRowsInPrevRange.length;
  const rentalVariation = previousRange ? percentChange(totalRentals, totalRentalsPrev) : null;

  const rankingLabel = (costumeId: string | null) =>
    costumeId ? costumeNameById.get(costumeId) ?? 'Disfraz eliminado' : 'Histórico sin vincular';

  const rentedRankingCurrent = useMemo(() => rankRentalsByCostume(rentalRowsInRange), [rentalRowsInRange]);
  const rentedRankingPrev = useMemo(() => rankRentalsByCostume(rentalRowsInPrevRange), [rentalRowsInPrevRange]);
  const rentedRankingPrevByKey = useMemo(
    () => new Map(rentedRankingPrev.map((entry) => [entry.costumeId ?? 'unlinked', entry.count])),
    [rentedRankingPrev]
  );

  const rentedRankingRows: RankingRow[] = rentedRankingCurrent.map((entry) => ({
    costumeId: entry.costumeId,
    label: rankingLabel(entry.costumeId),
    count: entry.count,
  }));

  const viewedRankingCurrent = useMemo(
    () => [...viewCountsInRange].sort((a, b) => b.count - a.count),
    [viewCountsInRange]
  );
  const viewedRankingPrevByKey = useMemo(
    () => new Map(viewCountsInPrevRange.map((entry) => [entry.costume_id, entry.count])),
    [viewCountsInPrevRange]
  );

  const viewedRankingRows: RankingRow[] = viewedRankingCurrent.map((entry) => ({
    costumeId: entry.costume_id,
    label: rankingLabel(entry.costume_id),
    count: entry.count,
  }));

  const rentedDrawerRows: RankingDetailRow[] = rentedRankingCurrent.map((entry) => ({
    costumeId: entry.costumeId,
    label: rankingLabel(entry.costumeId),
    count: entry.count,
    previousCount: rentedRankingPrevByKey.get(entry.costumeId ?? 'unlinked') ?? 0,
  }));

  const viewedDrawerRows: RankingDetailRow[] = viewedRankingCurrent.map((entry) => ({
    costumeId: entry.costume_id,
    label: rankingLabel(entry.costume_id),
    count: entry.count,
    previousCount: viewedRankingPrevByKey.get(entry.costume_id) ?? 0,
  }));

  // Clics a WhatsApp: total exacto en el servidor; rankings y orígenes a partir de las filas paginadas.
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      countEvents('whatsapp_click', activeRange),
      previousRange ? countEvents('whatsapp_click', previousRange) : Promise.resolve(0),
    ])
      .then(([now, prev]) => {
        if (isMounted) {
          setClickTotals({ now, prev });
        }
      })
      .catch((error) => {
        if (isMounted) {
          notifyError(error);
        }
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRange, previousRange]);

  const clickVariation = previousRange ? percentChange(clickTotals.now, clickTotals.prev) : null;
  const fullClickTrackingSince = useMemo(() => getFullClickTrackingSince(allClickEvents), [allClickEvents]);
  const clicksNote = fullClickTrackingSince
    ? `Medición completa desde el ${fullClickTrackingSince.toLocaleDateString('es-CO')}.`
    : 'Hasta ahora solo se mide el botón de la ficha de disfraz.';

  const clicksBySource = useMemo(
    () => aggregateClicksBySource(allClickEvents, activeRange),
    [allClickEvents, activeRange]
  );
  const maxSourceCount = clicksBySource[0]?.count ?? 0;

  const clickedRankingCurrent = useMemo(
    () => [...aggregateEventCounts(allClickEvents, activeRange)].sort((a, b) => b.count - a.count),
    [allClickEvents, activeRange]
  );
  const clickedRankingPrevByKey = useMemo(
    () =>
      new Map(
        (previousRange ? aggregateEventCounts(allClickEvents, previousRange) : []).map((entry) => [
          entry.costume_id,
          entry.count,
        ])
      ),
    [allClickEvents, previousRange]
  );
  const clickedRankingRows: RankingRow[] = clickedRankingCurrent.map((entry) => ({
    costumeId: entry.costume_id,
    label: rankingLabel(entry.costume_id),
    count: entry.count,
  }));
  const clickedDrawerRows: RankingDetailRow[] = clickedRankingCurrent.map((entry) => ({
    costumeId: entry.costume_id,
    label: rankingLabel(entry.costume_id),
    count: entry.count,
    previousCount: clickedRankingPrevByKey.get(entry.costume_id) ?? 0,
  }));

  const unmatchedLabels = useMemo(() => {
    const set = new Set<string>();
    allRentalHistory.forEach((row) => {
      if (!row.matched_costume_id) {
        set.add(row.costume_label);
      }
    });
    return Array.from(set).sort();
  }, [allRentalHistory]);

  const handleImport = async (rows: RentalHistoryImportRow[]) => {
    setIsImporting(true);
    try {
      const { inserted } = await importRentalHistoryCsv(rows, aliases);
      await loadAll();
      notify(`${inserted} filas importadas correctamente.`);
    } catch (error) {
      notifyError(error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmLink = async (label: string, costumeId: string) => {
    try {
      await confirmLabelMatch(label, costumeId);
      await loadAll();
      notify('Etiqueta vinculada correctamente.');
    } catch (error) {
      notifyError(error);
    }
  };

  const scrollToLinking = () => {
    linkingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <PeriodSelector
        value={period}
        customRange={customRange}
        onChange={setPeriod}
        onCustomRangeChange={setCustomRange}
      />

      {isLoading ? (
        <p className="text-sm text-[#5C5257]">Cargando Insights...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Total de alquileres en el periodo"
              value={totalRentals}
              source="Histórico de alquileres"
              variation={rentalVariation}
              isEmpty={totalRentals === 0}
            />
            <KpiCard
              label="Clics a WhatsApp en el periodo"
              value={clickTotals.now}
              source="Visitas al sitio"
              variation={clickVariation}
              isEmpty={clickTotals.now === 0}
              note={clicksNote}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopRankingCard
              title="Top disfraces más alquilados"
              source="Histórico de alquileres"
              rows={rentedRankingRows}
              onViewAll={() => setDrawer('alquilados')}
            />
            <TopRankingCard
              title="Top disfraces más visualizados"
              source="Visitas al sitio"
              rows={viewedRankingRows}
              onViewAll={() => setDrawer('visualizados')}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section
              aria-labelledby="insights-clics-origen"
              className="space-y-3 rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 id="insights-clics-origen" className="font-serif text-lg text-[#1A1418]">
                  Clics a WhatsApp por origen
                </h3>
                <span className="text-[10px] uppercase tracking-wide text-[#5C5257]/70">Fuente: Visitas al sitio</span>
              </div>
              {clicksBySource.length === 0 ? (
                <p className="text-sm text-[#5C5257]">
                  Aún no hay movimiento registrado en este periodo. Prueba con otro rango de fechas.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {clicksBySource.map((entry) => (
                    <li key={entry.source} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-[#1A1418]">{entry.label}</span>
                        <span className="font-mono font-semibold text-[#A8001A]">{entry.count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1A1418]/5">
                        <div
                          className="h-full rounded-full bg-[#A8001A]"
                          style={{ width: `${maxSourceCount ? (entry.count / maxSourceCount) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs leading-[1.5] text-[#5C5257]">{clicksNote}</p>
            </section>
            <TopRankingCard
              title="Disfraces con más clics a WhatsApp"
              source="Visitas al sitio"
              rows={clickedRankingRows}
              onViewAll={() => setDrawer('clics')}
            />
          </div>

          <RentalHistoryTable rows={rentalRowsInRange} costumes={costumes} onRequestLink={scrollToLinking} />

          <CsvImportPanel onImport={handleImport} isImporting={isImporting} />

          <div ref={linkingRef}>
            <LinkingUtility unmatchedLabels={unmatchedLabels} costumes={costumes} onConfirm={handleConfirmLink} />
          </div>
        </>
      )}

      <RankingDetailDrawer
        open={drawer === 'alquilados'}
        title="Top disfraces más alquilados — detalle completo"
        rows={rentedDrawerRows}
        onClose={() => setDrawer(null)}
        onNavigateToCostume={onNavigateToCostume}
      />
      <RankingDetailDrawer
        open={drawer === 'clics'}
        title="Disfraces con más clics a WhatsApp — detalle completo"
        rows={clickedDrawerRows}
        onClose={() => setDrawer(null)}
        onNavigateToCostume={onNavigateToCostume}
      />
      <RankingDetailDrawer
        open={drawer === 'visualizados'}
        title="Top disfraces más visualizados — detalle completo"
        rows={viewedDrawerRows}
        onClose={() => setDrawer(null)}
        onNavigateToCostume={onNavigateToCostume}
      />
    </div>
  );
}
