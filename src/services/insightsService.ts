import { supabaseAdmin } from '../lib/supabase';
import type {
  AdminRentalHistoryRow,
  RentalHistoryImportRow,
  AdminCostumeLabelAlias,
  CostumeEventCount,
  DateRange,
} from '../types';
import { parseCsvToObjects } from '../utils/csv';
import { normalizeLabel, similarityScore } from '../utils/textMatch';

function toRentalHistoryRow(record: any): AdminRentalHistoryRow {
  return {
    id: record.id,
    source_file: record.source_file ?? null,
    invoice_number: record.invoice_number ?? null,
    customer_name: record.customer_name ?? null,
    customer_address: record.customer_address ?? null,
    customer_phone: record.customer_phone ?? null,
    rental_date: record.rental_date ?? null,
    costume_label: record.costume_label,
    category_label: record.category_label ?? null,
    accessories_text: record.accessories_text ?? null,
    total_value:
      record.total_value !== null && record.total_value !== undefined ? Number(record.total_value) : null,
    deposit_value:
      record.deposit_value !== null && record.deposit_value !== undefined ? Number(record.deposit_value) : null,
    notes: record.notes ?? null,
    matched_costume_id: record.matched_costume_id ?? null,
    created_at: record.created_at,
  };
}

/** Fetches the full historical table once; period filtering happens client-side (see filterRentalHistoryByRange) so switching periods is instant. */
export async function fetchRentalHistory(): Promise<AdminRentalHistoryRow[]> {
  const { data, error } = await supabaseAdmin
    .from('costume_rental_history')
    .select('*')
    .order('rental_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toRentalHistoryRow);
}

export function filterRentalHistoryByRange(
  rows: AdminRentalHistoryRow[],
  range: DateRange
): AdminRentalHistoryRow[] {
  if (!range.from && !range.to) {
    return rows;
  }

  return rows.filter((row) => {
    if (!row.rental_date) {
      return false;
    }
    const date = new Date(row.rental_date);
    if (range.from && date.getTime() < range.from.getTime()) {
      return false;
    }
    if (range.to && date.getTime() > range.to.getTime()) {
      return false;
    }
    return true;
  });
}

export interface CostumeEventRow {
  costume_id: string;
  occurred_at: string;
}

/** Fetches raw event rows once; aggregation/period filtering happens client-side (see aggregateEventCounts). */
export async function fetchCostumeEvents(eventType: 'view' | 'whatsapp_click'): Promise<CostumeEventRow[]> {
  const { data, error } = await supabaseAdmin
    .from('costume_events')
    .select('costume_id, occurred_at')
    .eq('event_type', eventType);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CostumeEventRow[];
}

export function aggregateEventCounts(rows: CostumeEventRow[], range: DateRange): CostumeEventCount[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const time = new Date(row.occurred_at).getTime();
    if (range.from && time < range.from.getTime()) {
      return;
    }
    if (range.to && time > range.to.getTime()) {
      return;
    }
    counts.set(row.costume_id, (counts.get(row.costume_id) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([costume_id, count]) => ({ costume_id, count }));
}

export interface RentalRankingEntry {
  costumeId: string | null;
  count: number;
}

/** Aggregates rental history rows by matched costume; unmatched rows group under costumeId = null ("Histórico sin vincular"). */
export function rankRentalsByCostume(rows: AdminRentalHistoryRow[]): RentalRankingEntry[] {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = row.matched_costume_id ?? 'unlinked';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([key, count]) => ({ costumeId: key === 'unlinked' ? null : key, count }))
    .sort((a, b) => b.count - a.count);
}

export interface MatchableCostume {
  id: string;
  name: string;
  slug: string;
  featured: boolean;
}

export async function fetchCostumesForMatching(): Promise<MatchableCostume[]> {
  const { data, error } = await supabaseAdmin
    .from('costumes')
    .select('id, name, slug, featured')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MatchableCostume[];
}

export async function fetchLabelAliases(): Promise<AdminCostumeLabelAlias[]> {
  const { data, error } = await supabaseAdmin.from('costume_label_aliases').select('*');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as AdminCostumeLabelAlias[];
}

export interface LabelMatchSuggestion {
  costumeId: string;
  costumeName: string;
  score: number;
}

/** Ranks candidate costumes by text similarity against a free-text CSV label (name and slug both considered). */
export function suggestLabelMatches(
  label: string,
  costumes: MatchableCostume[],
  limit = 3
): LabelMatchSuggestion[] {
  return costumes
    .map((costume) => ({
      costumeId: costume.id,
      costumeName: costume.name,
      score: Math.max(
        similarityScore(label, costume.name),
        similarityScore(label, costume.slug.replace(/-/g, ' '))
      ),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Confirms a manual match: stores the alias for future imports and retroactively relinks existing rows with the same label. */
export async function confirmLabelMatch(rawLabel: string, costumeId: string) {
  const labelNorm = normalizeLabel(rawLabel);

  const { error: aliasError } = await supabaseAdmin
    .from('costume_label_aliases')
    .upsert({ label_norm: labelNorm, matched_costume_id: costumeId }, { onConflict: 'label_norm' });

  if (aliasError) {
    throw new Error(aliasError.message);
  }

  const { data: existingLabels, error: labelsError } = await supabaseAdmin
    .from('costume_rental_history')
    .select('costume_label')
    .is('matched_costume_id', null);

  if (labelsError) {
    throw new Error(labelsError.message);
  }

  const matchingRawLabels = Array.from(
    new Set(
      (existingLabels ?? [])
        .map((row: any) => row.costume_label as string)
        .filter((rawValue) => normalizeLabel(rawValue) === labelNorm)
    )
  );

  if (matchingRawLabels.length === 0) {
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from('costume_rental_history')
    .update({ matched_costume_id: costumeId })
    .in('costume_label', matchingRawLabels);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseRentalDate(value: string): string | null {
  const trimmed = value.trim();
  return ISO_DATE_RE.test(trimmed) ? trimmed : null;
}

function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return 0;
  }
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Maps the known CSV header (archivo, numero_factura, cliente, direccion, telefono_nit, fecha, Disfraz, categoria, Accesorios, valor_total, deposito, notas) into import rows. */
export function parseRentalHistoryCsv(csvText: string): RentalHistoryImportRow[] {
  const records = parseCsvToObjects(csvText);

  return records
    .filter((record) => (record.Disfraz ?? '').trim() !== '')
    .map((record) => ({
      source_file: record.archivo || null,
      invoice_number: record.numero_factura || null,
      customer_name: record.cliente || null,
      customer_address: record.direccion || null,
      customer_phone: record.telefono_nit || null,
      rental_date: parseRentalDate(record.fecha ?? ''),
      costume_label: record.Disfraz,
      category_label: record.categoria || null,
      accessories_text: record.Accesorios || null,
      total_value: parseAmount(record.valor_total ?? ''),
      deposit_value: parseAmount(record.deposito ?? ''),
      notes: record.notas || null,
      matched_costume_id: null,
    }));
}

const IMPORT_BATCH_SIZE = 50;

export async function importRentalHistoryCsv(
  rows: RentalHistoryImportRow[],
  aliases: AdminCostumeLabelAlias[]
): Promise<{ inserted: number }> {
  const aliasByNorm = new Map(aliases.map((alias) => [alias.label_norm, alias.matched_costume_id]));

  const preparedRows = rows.map((row) => ({
    ...row,
    matched_costume_id: row.matched_costume_id ?? aliasByNorm.get(normalizeLabel(row.costume_label)) ?? null,
  }));

  let inserted = 0;
  for (let i = 0; i < preparedRows.length; i += IMPORT_BATCH_SIZE) {
    const batch = preparedRows.slice(i, i + IMPORT_BATCH_SIZE);
    const { error } = await supabaseAdmin.from('costume_rental_history').insert(batch);
    if (error) {
      throw new Error(`${error.message} (lote desde fila ${i + 1})`);
    }
    inserted += batch.length;
  }

  return { inserted };
}
