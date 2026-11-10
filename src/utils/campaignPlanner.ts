/**
 * Planificador de campañas de carruseles (spec publicacion_carruseles_instagram §4).
 * Función pura: dado el catálogo elegido y las fechas, reparte los disfraces en carruseles y los
 * carruseles en las fechas disponibles. Cada disfraz aparece al menos una vez y no se repite hasta
 * haber mostrado todos.
 */

export type CampaignGrouping = 'categoria' | 'mezclado' | 'destacados_primero';

export interface PlannerCostume {
  id: string;
  name: string;
  category: string;
  featured: boolean;
}

export interface PlannerMilestones {
  /** Lectura del Bando (YYYY-MM-DD): el primer carrusel desde esa fecha la menciona. */
  bando?: string | null;
  /** Inicio del Carnaval (YYYY-MM-DD): los carruseles desde `countdownFrom` llevan cuenta regresiva. */
  carnival?: string | null;
  countdownFrom?: string | null;
}

export interface PlannerInput {
  costumes: PlannerCostume[];
  startDate: string;
  endDate: string;
  /** 0 = domingo … 6 = sábado */
  weekdays: number[];
  time: string;
  itemsPerPost: number;
  grouping: CampaignGrouping;
  fillWithFeatured: boolean;
  milestones: PlannerMilestones;
  campaignName: string;
  /** Instante actual (para no planear en el pasado). */
  now: Date;
}

export interface PlannedPost {
  date: string;
  scheduledAt: string;
  costumeIds: string[];
  label: string;
  theme: string;
  repeat: boolean;
}

export interface PlannerResult {
  posts: PlannedPost[];
  slotsAvailable: number;
  postsNeeded: number;
  feasible: boolean;
  suggestions: string[];
  emptySlots: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function toIsoBogota(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 5)}:00-05:00`).toISOString();
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function listSlots(input: Pick<PlannerInput, 'startDate' | 'endDate' | 'weekdays' | 'time' | 'now'>) {
  const slots: string[] = [];
  if (!input.weekdays.length || input.endDate < input.startDate) return slots;
  const minTime = input.now.getTime() + 30 * 60 * 1000;
  for (let date = input.startDate; date <= input.endDate; date = addDays(date, 1)) {
    if (input.weekdays.includes(weekdayOf(date)) && new Date(toIsoBogota(date, input.time)).getTime() > minTime) {
      slots.push(date);
    }
  }
  return slots;
}

/**
 * Parte una lista en `ceil(n / k)` grupos lo más parejos posible (ej. 7 con k=5 → 4 + 3).
 * Un carrusel necesita al menos 2 imágenes, así que nunca deja un grupo de 1: con k=2 y n impar, el sobrante se
 * suma a otro grupo (ej. 5 con k=2 → 3 + 2). Solo con k=2 un grupo puede pasar de k (queda en 3).
 */
export function chunkEvenly<T>(list: T[], maxSize: number): T[][] {
  if (!list.length) return [];
  if (list.length < 2) return [list.slice()];
  const count = Math.min(Math.ceil(list.length / maxSize), Math.floor(list.length / 2));
  const base = Math.floor(list.length / count);
  let extra = list.length % count;
  const chunks: T[][] = [];
  let index = 0;
  for (let i = 0; i < count; i += 1) {
    const size = base + (extra > 0 ? 1 : 0);
    extra -= 1;
    chunks.push(list.slice(index, index + size));
    index += size;
  }
  return chunks;
}

const byFeaturedThenName = (a: PlannerCostume, b: PlannerCostume) =>
  Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, 'es');

function groupByCategory(costumes: PlannerCostume[]) {
  const map = new Map<string, PlannerCostume[]>();
  costumes.forEach((costume) => map.set(costume.category, [...(map.get(costume.category) ?? []), costume]));
  return Array.from(map.entries())
    .map(([category, list]) => ({ category, list: [...list].sort(byFeaturedThenName) }))
    .sort((a, b) => b.list.length - a.list.length || a.category.localeCompare(b.category, 'es'));
}

function interleave(groups: PlannerCostume[][]) {
  const result: PlannerCostume[] = [];
  const max = Math.max(0, ...groups.map((group) => group.length));
  for (let i = 0; i < max; i += 1) groups.forEach((group) => group[i] && result.push(group[i]));
  return result;
}

/** Arma los grupos de disfraces (cada grupo = un carrusel) según la forma de agrupar. */
export function buildGroups(costumes: PlannerCostume[], itemsPerPost: number, grouping: CampaignGrouping) {
  const size = Math.min(10, Math.max(2, itemsPerPost));
  if (costumes.length < 2) return [] as Array<{ costumes: PlannerCostume[]; label: string }>;

  if (grouping === 'categoria') {
    const groups: Array<{ costumes: PlannerCostume[]; label: string }> = [];
    const leftovers: PlannerCostume[] = [];
    groupByCategory(costumes).forEach(({ category, list }) => {
      if (list.length < 2) {
        leftovers.push(...list);
        return;
      }
      chunkEvenly(list, size).forEach((chunk) => groups.push({ costumes: chunk, label: category }));
    });
    if (leftovers.length >= 2) {
      chunkEvenly(leftovers, size).forEach((chunk) => groups.push({ costumes: chunk, label: 'Variados' }));
    } else if (leftovers.length === 1) {
      // Un disfraz suelto se suma al grupo más pequeño que tenga espacio.
      const target = [...groups].sort((a, b) => a.costumes.length - b.costumes.length).find((g) => g.costumes.length < 10);
      if (target) target.costumes.push(leftovers[0]);
      else groups.push({ costumes: [leftovers[0], groups[0]?.costumes[0]].filter(Boolean) as PlannerCostume[], label: 'Variados' });
    }
    return groups;
  }

  const ordered =
    grouping === 'mezclado'
      ? interleave(groupByCategory(costumes).map((entry) => entry.list))
      : [
          ...interleave(groupByCategory(costumes.filter((c) => c.featured)).map((entry) => entry.list)),
          ...interleave(groupByCategory(costumes.filter((c) => !c.featured)).map((entry) => entry.list)),
        ];
  return chunkEvenly(ordered, size).map((chunk) => ({
    costumes: chunk,
    label: Array.from(new Set(chunk.map((c) => c.category))).slice(0, 3).join(', '),
  }));
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / DAY_MS);
}

function themeFor(date: string, base: string, milestones: PlannerMilestones, bandoUsed: { value: boolean }) {
  const parts = [base];
  if (milestones.bando && !bandoUsed.value && date >= milestones.bando) {
    bandoUsed.value = true;
    parts.push(
      date === milestones.bando
        ? 'Hoy es la Lectura del Bando: arranca oficialmente la temporada de Carnaval'
        : 'Ya se leyó el Bando: arrancó oficialmente la temporada de Carnaval'
    );
  }
  if (milestones.carnival && milestones.countdownFrom && date >= milestones.countdownFrom && date < milestones.carnival) {
    const days = daysBetween(date, milestones.carnival);
    parts.push(`Cuenta regresiva: faltan ${days} ${days === 1 ? 'día' : 'días'} para el Carnaval de Barranquilla`);
  }
  return parts.join('. ');
}

export function planCampaign(input: PlannerInput): PlannerResult {
  const size = Math.min(10, Math.max(2, input.itemsPerPost));
  const slots = listSlots(input);
  const groups = buildGroups(input.costumes, size, input.grouping);
  const suggestions: string[] = [];

  if (groups.length > slots.length) {
    const neededSize = slots.length ? Math.ceil(input.costumes.length / slots.length) : null;
    if (neededSize && neededSize <= 10) {
      suggestions.push(`Sube a ${neededSize} disfraces por carrusel para que todo quepa en ${slots.length} fechas.`);
    }
    const perWeek = input.weekdays.length;
    if (perWeek < 7) {
      suggestions.push(`Agrega días de publicación (hoy son ${perWeek} por semana: ${input.weekdays.map((d) => WEEKDAY_NAMES[d]).join(', ') || 'ninguno'}).`);
    }
    suggestions.push('O amplía la fecha de fin, o reduce los disfraces incluidos con los filtros.');
    return { posts: [], slotsAvailable: slots.length, postsNeeded: groups.length, feasible: false, suggestions, emptySlots: 0 };
  }

  // Reparto parejo de los carruseles en las fechas disponibles.
  const assigned = new Map<number, { costumes: PlannerCostume[]; label: string; repeat: boolean }>();
  groups.forEach((group, index) => {
    const slotIndex = Math.floor((index * slots.length) / Math.max(groups.length, 1));
    assigned.set(slotIndex, { ...group, repeat: false });
  });

  let emptySlots = slots.length - assigned.size;
  if (input.fillWithFeatured && emptySlots > 0) {
    const featured = input.costumes.filter((c) => c.featured).sort(byFeaturedThenName);
    const repeatGroups = featured.length >= 2 ? chunkEvenly(featured, size) : [];
    let cursor = 0;
    slots.forEach((_, slotIndex) => {
      if (!assigned.has(slotIndex) && repeatGroups.length) {
        assigned.set(slotIndex, { costumes: repeatGroups[cursor % repeatGroups.length], label: 'Destacados', repeat: true });
        cursor += 1;
      }
    });
    emptySlots = slots.length - assigned.size;
  } else if (emptySlots > 0) {
    suggestions.push(
      `Quedan ${emptySlots} fechas libres: puedes activar "Repetir destacados" o bajar los disfraces por carrusel para publicar más seguido.`
    );
  }

  const bandoUsed = { value: false };
  const posts: PlannedPost[] = Array.from(assigned.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([slotIndex, group]) => {
      const date = slots[slotIndex];
      const base = group.repeat ? `${input.campaignName}: los favoritos de la temporada` : `${input.campaignName}: ${group.label}`;
      return {
        date,
        scheduledAt: toIsoBogota(date, input.time),
        costumeIds: group.costumes.map((c) => c.id),
        label: group.repeat ? 'Destacados (repetición)' : group.label,
        theme: themeFor(date, base, input.milestones, bandoUsed),
        repeat: group.repeat,
      };
    });

  return { posts, slotsAvailable: slots.length, postsNeeded: groups.length, feasible: true, suggestions, emptySlots };
}
