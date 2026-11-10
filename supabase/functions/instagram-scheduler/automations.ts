// Reglas recurrentes y campañas (spec publicacion_carruseles_instagram §3 y §4).
// - Reglas: generan su próximo carrusel con anticipación (GENERATE_DAYS_AHEAD) para poder revisarlo.
// - Campañas: se marcan como terminadas al pasar su fecha de fin y, si lo tienen activado, suman los
//   disfraces nuevos a sus carruseles aún no publicados.
import { generateCaption, loadCaptionCostumes } from '../_shared/captions.ts';
import { log, type SchedulerContext } from './context.ts';

const GENERATE_DAYS_AHEAD = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000;
/** Un carrusel de campaña no se modifica si se publica en menos de este margen. */
const CAMPAIGN_EDIT_MARGIN_MS = 2 * 60 * 60 * 1000;
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

interface CatalogCostume {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  featured: boolean;
  created_at: string;
  primary_path: string;
  alt_text: string | null;
  /** Galería en el orden del catálogo (principal y luego sort_order), máx. 10, para carruseles de un disfraz. */
  gallery: Array<{ path: string; alt_text: string | null }>;
}

const MAX_CAROUSEL_ITEMS = 10;

// ---------------------------------------------------------------------------------------------
// Fechas en hora de Colombia
// ---------------------------------------------------------------------------------------------

function bogotaToday(now: Date) {
  return new Date(now.getTime() - BOGOTA_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 5)}:00-05:00`).toISOString();
}

/** Próxima fecha y hora de la regla (semanal: cada semana; mensual: el primer `weekday` del mes). */
export function nextOccurrence(rule: { cadence: string; weekday: number; publish_time: string }, now: Date) {
  const minTime = now.getTime() + 30 * 60 * 1000;
  const today = bogotaToday(now);
  for (let offset = 0; offset < 40; offset += 1) {
    const date = addDays(today, offset);
    const day = new Date(`${date}T12:00:00Z`);
    if (day.getUTCDay() !== rule.weekday) continue;
    if (rule.cadence === 'mensual' && day.getUTCDate() > 7) continue;
    const iso = toIso(date, rule.publish_time);
    if (new Date(iso).getTime() > minTime) return { date, iso };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------------------------

/** Disfraces disponibles con foto principal (los únicos que pueden ir a Instagram). */
async function loadCatalog(ctx: SchedulerContext): Promise<CatalogCostume[]> {
  const { data, error } = await ctx.db
    .from('costumes')
    .select('id, name, category_id, featured, created_at, categories(name), costume_images(storage_path, alt_text, is_primary, sort_order)')
    .eq('is_available', true);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row: any) => {
      const images = [...(row.costume_images ?? [])].sort(
        (a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      );
      const primary = images.find((image: any) => image.is_primary);
      if (!primary) return null;
      return {
        id: row.id,
        name: row.name,
        category_id: row.category_id,
        category_name: row.categories?.name ?? 'Sin categoría',
        featured: Boolean(row.featured),
        created_at: row.created_at,
        primary_path: primary.storage_path,
        alt_text: primary.alt_text ?? null,
        gallery: images.slice(0, MAX_CAROUSEL_ITEMS).map((image: any) => ({ path: image.storage_path, alt_text: image.alt_text ?? null })),
      } as CatalogCostume;
    })
    .filter(Boolean) as CatalogCostume[];
}

async function captionFor(ctx: SchedulerContext, costumeIds: string[], theme: string) {
  try {
    const costumes = await loadCaptionCostumes(ctx.db, costumeIds);
    const { caption } = await generateCaption({ costumes, theme });
    return caption;
  } catch (error) {
    console.error('[instagram-scheduler] no se pudo escribir el texto', error);
    return '';
  }
}

async function insertPost(
  ctx: SchedulerContext,
  post: {
    source: 'regla' | 'campana';
    rule_id?: string;
    campaign_id?: string;
    title: string;
    caption: string;
    scheduled_at: string;
    requiresApproval: boolean;
  },
  costumes: CatalogCostume[],
  /** Carrusel de un solo disfraz con todas sus fotos (en vez de la foto principal de cada disfraz). */
  useGallery = false
) {
  const status = !post.caption ? 'borrador' : post.requiresApproval ? 'pendiente' : 'programado';
  const nowIso = ctx.now.toISOString();
  const { data, error } = await ctx.db
    .from('instagram_posts')
    .insert({
      source: post.source,
      rule_id: post.rule_id ?? null,
      campaign_id: post.campaign_id ?? null,
      title: post.title,
      caption: post.caption,
      scheduled_at: post.scheduled_at,
      status,
      approved_at: status === 'programado' ? nowIso : null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  const rows = useGallery
    ? costumes[0].gallery.map((image, position) => ({
        post_id: data.id,
        position,
        costume_id: costumes[0].id,
        source_bucket: 'costume-images',
        source_path: image.path,
        alt_text: image.alt_text,
      }))
    : costumes.map((costume, position) => ({
        post_id: data.id,
        position,
        costume_id: costume.id,
        source_bucket: 'costume-images',
        source_path: costume.primary_path,
        alt_text: costume.alt_text,
      }));
  const { error: itemsError } = await ctx.db.from('instagram_post_items').insert(rows);
  if (itemsError) {
    await ctx.db.from('instagram_posts').delete().eq('id', data.id);
    throw new Error(itemsError.message);
  }
  if (!post.caption) {
    await log(ctx, data.id, 'error', 'No se pudo escribir el texto con IA: quedó como borrador para completarlo a mano.');
  }
  return { id: data.id as string, status };
}

// ---------------------------------------------------------------------------------------------
// Reglas recurrentes
// ---------------------------------------------------------------------------------------------

const byFeaturedThenNewest = (a: CatalogCostume, b: CatalogCostume) =>
  Number(b.featured) - Number(a.featured) || b.created_at.localeCompare(a.created_at);

/** Disfraces agregados desde la última publicación de la regla (o desde que se creó). */
function pickNovedades(rule: any, catalog: CatalogCostume[]) {
  const since: string = rule.state?.since ?? rule.created_at;
  const list = catalog.filter((costume) => costume.created_at > since).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    costumes: list.slice(0, rule.items_count),
    theme: 'Novedades del atelier: los disfraces que acaban de llegar',
    title: 'Novedades',
    state: { ...rule.state },
  };
}

/** Los más alquilados del mes anterior (histórico de alquileres vinculado a disfraces). */
async function pickMasAlquilados(ctx: SchedulerContext, rule: any, catalog: CatalogCostume[], occurrenceDate: string) {
  const [year, month] = occurrenceDate.split('-').map(Number);
  const prevMonthIndex = (month + 10) % 12; // 0-based del mes anterior
  const prevYear = month === 1 ? year - 1 : year;
  const from = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month).padStart(2, '0')}-01`;
  const { data, error } = await ctx.db
    .from('costume_rental_history')
    .select('matched_costume_id')
    .gte('rental_date', from)
    .lt('rental_date', to)
    .not('matched_costume_id', 'is', null);
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  (data ?? []).forEach((row: any) => counts.set(row.matched_costume_id, (counts.get(row.matched_costume_id) ?? 0) + 1));
  const byId = new Map(catalog.map((costume) => [costume.id, costume]));
  const ranked = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => byId.get(id))
    .filter(Boolean) as CatalogCostume[];
  const monthName = MONTHS[prevMonthIndex];
  return {
    costumes: ranked.slice(0, rule.items_count),
    theme: `Los más alquilados de ${monthName}: los favoritos de nuestras clientas`,
    title: `Los más alquilados de ${monthName}`,
    state: { ...rule.state },
  };
}

/** Rota entre categorías con al menos 2 disfraces disponibles con foto; dentro de cada una, rota los disfraces. */
function pickCategoriaSemana(rule: any, catalog: CatalogCostume[]) {
  const byCategory = new Map<string, CatalogCostume[]>();
  catalog.forEach((costume) => byCategory.set(costume.category_id, [...(byCategory.get(costume.category_id) ?? []), costume]));
  const categories = Array.from(byCategory.entries())
    .filter(([, list]) => list.length >= 2)
    .sort((a, b) => a[1][0].category_name.localeCompare(b[1][0].category_name, 'es'));
  if (!categories.length) return { costumes: [], theme: '', title: 'Categoría de la semana', state: { ...rule.state } };

  const lastCategoryId: string | undefined = rule.state?.last_category_id;
  const lastIndex = categories.findIndex(([id]) => id === lastCategoryId);
  const [categoryId, list] = categories[(lastIndex + 1) % categories.length];
  const offsets: Record<string, number> = { ...(rule.state?.offsets ?? {}) };
  const ordered = [...list].sort(byFeaturedThenNewest);
  const start = (offsets[categoryId] ?? 0) % ordered.length;
  const take = Math.min(rule.items_count, ordered.length);
  const picked = Array.from({ length: take }, (_, i) => ordered[(start + i) % ordered.length]);
  offsets[categoryId] = (start + take) % ordered.length;
  const name = list[0].category_name;
  return {
    costumes: picked,
    theme: `Categoría de la semana: ${name}`,
    title: `Categoría de la semana: ${name}`,
    state: { ...rule.state, last_category_id: categoryId, offsets },
  };
}

async function runRules(ctx: SchedulerContext, catalog: CatalogCostume[] | null) {
  const { data: rules, error } = await ctx.db.from('instagram_rules').select('*').eq('active', true);
  if (error) throw new Error(error.message);
  let created = 0;
  const skipped: string[] = [];
  for (const rule of rules ?? []) {
    const next = nextOccurrence(rule, ctx.now);
    if (!next) continue;
    if (new Date(next.iso).getTime() - ctx.now.getTime() > GENERATE_DAYS_AHEAD * DAY_MS) continue;
    if (rule.last_generated_for && new Date(rule.last_generated_for).getTime() >= new Date(next.iso).getTime()) continue;

    // Si la regla se editó (otro día u hora), no duplicar el carrusel que ya generó para esas fechas.
    const nextTime = new Date(next.iso).getTime();
    const { count: nearby } = await ctx.db
      .from('instagram_posts')
      .select('id', { count: 'exact', head: true })
      .eq('rule_id', rule.id)
      .neq('status', 'cancelado')
      .gte('scheduled_at', new Date(nextTime - 1.5 * DAY_MS).toISOString())
      .lte('scheduled_at', new Date(nextTime + 1.5 * DAY_MS).toISOString());
    if ((nearby ?? 0) > 0) {
      await ctx.db.from('instagram_rules').update({ last_generated_for: next.iso, updated_at: ctx.now.toISOString() }).eq('id', rule.id);
      continue;
    }

    catalog = catalog ?? (await loadCatalog(ctx));
    const pick =
      rule.kind === 'novedades'
        ? pickNovedades(rule, catalog)
        : rule.kind === 'mas_alquilados'
          ? await pickMasAlquilados(ctx, rule, catalog, next.date)
          : pickCategoriaSemana(rule, catalog);

    const nowIso = ctx.now.toISOString();
    if (pick.costumes.length < 2) {
      // No hay suficiente material: no se publica esta vez (la regla vuelve a intentarlo en la siguiente fecha).
      skipped.push(rule.name);
      await ctx.db
        .from('instagram_rules')
        .update({ last_generated_for: next.iso, state: { ...pick.state, last_skip: next.iso }, updated_at: nowIso })
        .eq('id', rule.id);
      continue;
    }

    const caption = await captionFor(ctx, pick.costumes.map((c) => c.id), pick.theme);
    await insertPost(
      ctx,
      { source: 'regla', rule_id: rule.id, title: pick.title, caption, scheduled_at: next.iso, requiresApproval: rule.requires_approval },
      pick.costumes
    );
    const state = rule.kind === 'novedades' ? { ...pick.state, since: nowIso } : pick.state;
    await ctx.db.from('instagram_rules').update({ last_generated_for: next.iso, state, updated_at: nowIso }).eq('id', rule.id);
    created += 1;
  }
  return { created, skipped };
}

// ---------------------------------------------------------------------------------------------
// Campañas
// ---------------------------------------------------------------------------------------------

async function loadSizeKinds(ctx: SchedulerContext) {
  const { data } = await ctx.db.from('costume_sizes').select('costume_id, size');
  const kinds = new Map<string, { adult: boolean; child: boolean }>();
  (data ?? []).forEach((row: any) => {
    const entry = kinds.get(row.costume_id) ?? { adult: false, child: false };
    if (/^\d+$/.test(String(row.size))) entry.child = true;
    else entry.adult = true;
    kinds.set(row.costume_id, entry);
  });
  return kinds;
}

function matchesFilters(costume: CatalogCostume, filters: any, sizeKinds: Map<string, { adult: boolean; child: boolean }>) {
  const categoryIds: string[] = Array.isArray(filters?.categoryIds) ? filters.categoryIds : [];
  if (categoryIds.length && !categoryIds.includes(costume.category_id)) return false;
  if (filters?.onlyFeatured && !costume.featured) return false;
  if (filters?.kind === 'adulto' || filters?.kind === 'nino') {
    const sizes = sizeKinds.get(costume.id);
    if (!sizes) return false;
    if (filters.kind === 'adulto' && !sizes.adult) return false;
    if (filters.kind === 'nino' && !sizes.child) return false;
  }
  return true;
}

async function runCampaigns(ctx: SchedulerContext, catalog: CatalogCostume[] | null) {
  const today = bogotaToday(ctx.now);
  const nowIso = ctx.now.toISOString();

  // 1. Terminadas: pasó la fecha de fin.
  const { data: finished } = await ctx.db
    .from('instagram_campaigns')
    .update({ status: 'terminada', updated_at: nowIso })
    .in('status', ['activa', 'pausada'])
    .lt('end_date', today)
    .select('id');

  // 2. Disfraces nuevos en campañas activas.
  const { data: campaigns, error } = await ctx.db
    .from('instagram_campaigns')
    .select('id, name, created_at, filters, requires_approval, grouping, weekdays, publish_time, end_date, milestones, state')
    .eq('status', 'activa')
    .eq('include_new_costumes', true);
  if (error) throw new Error(error.message);
  if (!campaigns?.length) return { terminadas: finished?.length ?? 0, sumados: 0 };

  catalog = catalog ?? (await loadCatalog(ctx));
  let sizeKinds: Map<string, { adult: boolean; child: boolean }> | null = null;
  let added = 0;
  const editableFrom = new Date(ctx.now.getTime() + CAMPAIGN_EDIT_MARGIN_MS).toISOString();

  for (const campaign of campaigns) {
    if (campaign.filters?.kind === 'adulto' || campaign.filters?.kind === 'nino') sizeKinds = sizeKinds ?? (await loadSizeKinds(ctx));
    if (campaign.grouping === 'por_disfraz') {
      added += await schedulePerCostume(ctx, campaign, catalog, sizeKinds ?? new Map());
      continue;
    }
    const candidates = catalog.filter((costume) => costume.created_at > campaign.created_at);
    if (!candidates.length) continue;
    const newOnes = candidates.filter((costume) => matchesFilters(costume, campaign.filters, sizeKinds ?? new Map()));
    if (!newOnes.length) continue;

    const { data: posts, error: postsError } = await ctx.db
      .from('instagram_posts')
      .select('id, title, status, scheduled_at, instagram_post_items(costume_id, position)')
      .eq('campaign_id', campaign.id);
    if (postsError) throw new Error(postsError.message);
    const alreadyIn = new Set((posts ?? []).flatMap((post: any) => (post.instagram_post_items ?? []).map((item: any) => item.costume_id)));
    const pending = newOnes.filter((costume) => !alreadyIn.has(costume.id));
    if (!pending.length) continue;

    // Solo se tocan carruseles no aprobados (o programados si la campaña publica sin aprobación),
    // con margen antes de su hora y con espacio (máx. 10 imágenes).
    const editableStatuses = campaign.requires_approval ? ['borrador', 'pendiente'] : ['borrador', 'pendiente', 'programado'];
    const targets = (posts ?? [])
      .filter((post: any) => editableStatuses.includes(post.status) && post.scheduled_at > editableFrom)
      .map((post: any) => ({ ...post, items: [...(post.instagram_post_items ?? [])] }))
      .filter((post: any) => post.items.length < 10);
    if (!targets.length) continue;

    const changed = new Map<string, { post: any; names: string[] }>();
    for (const costume of pending) {
      const target = [...targets].sort((a, b) => a.items.length - b.items.length || a.scheduled_at.localeCompare(b.scheduled_at))[0];
      if (!target || target.items.length >= 10) break;
      const position = target.items.length;
      const { error: insertError } = await ctx.db.from('instagram_post_items').insert({
        post_id: target.id,
        position,
        costume_id: costume.id,
        source_bucket: 'costume-images',
        source_path: costume.primary_path,
        alt_text: costume.alt_text,
      });
      if (insertError) {
        console.error('[instagram-scheduler] no se pudo sumar el disfraz', insertError);
        continue;
      }
      target.items.push({ costume_id: costume.id, position });
      const entry = changed.get(target.id) ?? { post: target, names: [] };
      entry.names.push(costume.name);
      changed.set(target.id, entry);
      added += 1;
    }

    // El texto debe nombrar a todos los disfraces: se reescribe y, si estaba aprobado, vuelve a revisión
    // solo cuando la campaña exige aprobación (en ese caso ya no puede estar programado).
    for (const { post, names } of changed.values()) {
      const ids = post.items.sort((a: any, b: any) => a.position - b.position).map((item: any) => item.costume_id);
      const caption = await captionFor(ctx, ids, post.title ?? campaign.name);
      const update: Record<string, unknown> = { updated_at: nowIso };
      if (caption) update.caption = caption;
      else update.status = 'borrador';
      await ctx.db.from('instagram_posts').update(update).eq('id', post.id);
      await log(
        ctx,
        post.id,
        'info',
        `Se sumó ${names.join(', ')} (disfraz nuevo en el catálogo)${caption ? ' y se reescribió el texto' : '; el texto quedó por completar'}.`
      );
    }
  }
  return { terminadas: finished?.length ?? 0, sumados: added };
}

// ---------------------------------------------------------------------------------------------
// Campañas "un disfraz por carrusel" (spec campanas_carrusel_por_disfraz)
// ---------------------------------------------------------------------------------------------

/** Al menos este margen entre que se detecta un disfraz y su carrusel, para poder revisarlo. */
const PER_COSTUME_LEAD_DAYS = 3;

function countdownTheme(date: string, base: string, milestones: any) {
  const parts = [base];
  const bando: string | null = milestones?.bando ?? null;
  const carnival: string | null = milestones?.carnival ?? null;
  if (bando && date === bando) parts.push('Hoy es la Lectura del Bando: arranca oficialmente la temporada de Carnaval');
  if (carnival && bando && date >= bando && date < carnival) {
    const days = Math.round((new Date(`${carnival}T12:00:00Z`).getTime() - new Date(`${date}T12:00:00Z`).getTime()) / DAY_MS);
    parts.push(`Cuenta regresiva: faltan ${days} ${days === 1 ? 'día' : 'días'} para el Carnaval de Barranquilla`);
  }
  return parts.join('. ');
}

/**
 * Da su propio carrusel, en la siguiente fecha libre de la campaña, a cada disfraz que cumple los filtros, tiene
 * 2 o más fotos y aún no está en la campaña (nuevo, o que se completó después de crearla). Si no quedan fechas, lo
 * deja en `state.sin_fecha`.
 */
async function schedulePerCostume(
  ctx: SchedulerContext,
  campaign: any,
  catalog: CatalogCostume[],
  sizeKinds: Map<string, { adult: boolean; child: boolean }>
) {
  const excluded: string[] = Array.isArray(campaign.filters?.excluded) ? campaign.filters.excluded : [];
  const { data: posts, error } = await ctx.db
    .from('instagram_posts')
    .select('scheduled_at, status, instagram_post_items(costume_id)')
    .eq('campaign_id', campaign.id);
  if (error) throw new Error(error.message);

  const inCampaign = new Set((posts ?? []).flatMap((post: any) => (post.instagram_post_items ?? []).map((item: any) => item.costume_id)));
  const pending = catalog.filter(
    (costume) =>
      costume.gallery.length >= 2 &&
      !inCampaign.has(costume.id) &&
      !excluded.includes(costume.id) &&
      matchesFilters(costume, campaign.filters, sizeKinds)
  );

  const previous: Array<{ costume_id: string; name: string; detected_at: string }> = campaign.state?.sin_fecha ?? [];
  if (!pending.length && !previous.length) return 0;

  // Fechas ocupadas (por día en Colombia) y fechas libres desde hoy + margen hasta el fin de la campaña.
  const taken = new Set(
    (posts ?? []).filter((post: any) => post.status !== 'cancelado').map((post: any) => bogotaToday(new Date(post.scheduled_at)))
  );
  const weekdays: number[] = campaign.weekdays ?? [];
  const firstDay = addDays(bogotaToday(ctx.now), PER_COSTUME_LEAD_DAYS);
  const freeDates: string[] = [];
  for (let date = firstDay; date <= campaign.end_date; date = addDays(date, 1)) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekdays.includes(weekday) && !taken.has(date)) freeDates.push(date);
  }

  let added = 0;
  const withoutDate: Array<{ costume_id: string; name: string; detected_at: string }> = [];
  for (const costume of pending.sort((a, b) => Number(b.featured) - Number(a.featured) || a.created_at.localeCompare(b.created_at))) {
    const date = freeDates.shift();
    if (!date) {
      const before = previous.find((entry) => entry.costume_id === costume.id);
      withoutDate.push({ costume_id: costume.id, name: costume.name, detected_at: before?.detected_at ?? ctx.now.toISOString() });
      continue;
    }
    const theme = countdownTheme(date, `${campaign.name}: ${costume.name}`, campaign.milestones);
    const caption = await captionFor(ctx, [costume.id], theme);
    const created = await insertPost(
      ctx,
      {
        source: 'campana',
        campaign_id: campaign.id,
        title: `${campaign.name} · ${costume.name}`,
        caption,
        scheduled_at: toIso(date, campaign.publish_time),
        requiresApproval: campaign.requires_approval,
      },
      [costume],
      true
    );
    await log(ctx, created.id, 'info', `Carrusel creado para ${costume.name} (disfraz nuevo o completado durante la campaña).`);
    added += 1;
  }

  const changed =
    withoutDate.length !== previous.length || withoutDate.some((entry) => !previous.find((p) => p.costume_id === entry.costume_id));
  if (changed) {
    await ctx.db
      .from('instagram_campaigns')
      .update({ state: { ...(campaign.state ?? {}), sin_fecha: withoutDate }, updated_at: ctx.now.toISOString() })
      .eq('id', campaign.id);
  }
  return added;
}

export async function runAutomations(ctx: SchedulerContext) {
  const reglas = await runRules(ctx, null).catch((error) => ({ error: String(error) }));
  const campanas = await runCampaigns(ctx, null).catch((error) => ({ error: String(error) }));
  return { reglas, campanas };
}
