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
  const [aliases, setAliases] = useState<AdminCostumeLabelAlias[]>([]);

  const [drawer, setDrawer] = useState<'alquilados' | 'visualizados' | null>(null);

  const linkingRef = useRef<HTMLDivElement | null>(null);

  const notify = (text: string, variant: ToastVariant = 'success') => setToast({ text, variant });
  const notifyError = (error: unknown) =>
    setToast({ text: error instanceof Error ? error.message : String(error), variant: 'error' });

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [costumesData, rentalData, viewEvents, aliasData] = await Promise.all([
        fetchCostumesForMatching(),
        fetchRentalHistory(),
        fetchCostumeEvents('view'),
        fetchLabelAliases(),
      ]);
      setCostumes(costumesData);
      setAllRentalHistory(rentalData);
      setAllViewEvents(viewEvents);
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
        <p className="text-sm text-[#6E4B4B]">Cargando Insights...</p>
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
        open={drawer === 'visualizados'}
        title="Top disfraces más visualizados — detalle completo"
        rows={viewedDrawerRows}
        onClose={() => setDrawer(null)}
        onNavigateToCostume={onNavigateToCostume}
      />
    </div>
  );
}
