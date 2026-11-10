import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabaseAdmin, getPublicImageUrl } from '../lib/supabase';

// ---------------------------------------------------------------------------------------------
// Tipos (tablas de la migración 015)
// ---------------------------------------------------------------------------------------------

export type InstagramPostStatus =
  | 'borrador'
  | 'pendiente'
  | 'programado'
  | 'publicando'
  | 'publicado'
  | 'fallido'
  | 'cancelado';

export type InstagramPostSource = 'manual' | 'regla' | 'campana';

export interface InstagramConnection {
  ig_user_id: string;
  username: string | null;
  account_name: string | null;
  connected_at: string;
  /** Nulo con el inicio de sesión unificado (el token de usuario del sistema no vence). */
  token_expires_at: string | null;
  last_checked_at: string | null;
  last_error: string | null;
}

export interface InstagramPostItem {
  id?: string;
  position: number;
  costume_id: string | null;
  source_bucket: string;
  source_path: string;
  alt_text: string | null;
}

export interface InstagramPost {
  id: string;
  source: InstagramPostSource;
  rule_id: string | null;
  campaign_id: string | null;
  title: string | null;
  caption: string;
  scheduled_at: string;
  status: InstagramPostStatus;
  approved_at: string | null;
  attempts: number;
  last_error: string | null;
  permalink: string | null;
  published_at: string | null;
  created_at: string;
  items: InstagramPostItem[];
}

export interface InstagramPostInput {
  title?: string | null;
  caption: string;
  scheduled_at: string;
  status: InstagramPostStatus;
  source?: InstagramPostSource;
  campaign_id?: string | null;
  rule_id?: string | null;
  items: InstagramPostItem[];
}

export const POST_STATUS_LABELS: Record<InstagramPostStatus, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente de aprobación',
  programado: 'Programado',
  publicando: 'Publicando',
  publicado: 'Publicado',
  fallido: 'Fallido',
  cancelado: 'Cancelado',
};

export const POST_SOURCE_LABELS: Record<InstagramPostSource, string> = {
  manual: 'Manual',
  regla: 'Regla',
  campana: 'Campaña',
};

// ---------------------------------------------------------------------------------------------
// Zona horaria: toda la programación es en hora de Colombia (UTC−5, sin horario de verano).
// ---------------------------------------------------------------------------------------------

const BOGOTA_OFFSET = '-05:00';

/** ISO → valor para <input type="datetime-local"> en hora de Colombia. */
export function toBogotaInput(iso: string) {
  const date = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
}

/** Valor de <input type="datetime-local"> (hora de Colombia) → ISO. */
export function fromBogotaInput(local: string) {
  return new Date(`${local}:00${BOGOTA_OFFSET}`).toISOString();
}

/** Fecha (YYYY-MM-DD) y hora (HH:mm) de Colombia → ISO. */
export function bogotaDateTimeToIso(date: string, time: string) {
  return new Date(`${date}T${time.slice(0, 5)}:00${BOGOTA_OFFSET}`).toISOString();
}

export function formatBogota(iso: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(iso));
}

/** YYYY-MM-DD del día en Colombia para un ISO. */
export function bogotaDayKey(iso: string) {
  return toBogotaInput(iso).slice(0, 10);
}

// ---------------------------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------------------------

export function itemImageUrl(item: Pick<InstagramPostItem, 'source_bucket' | 'source_path'>) {
  return getPublicImageUrl(item.source_path, item.source_bucket);
}

async function functionError(error: unknown, fallback: string): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') return new Error(body.error);
    } catch {
      // sin JSON
    }
  }
  return new Error(fallback);
}

function toPost(row: any): InstagramPost {
  return {
    ...row,
    caption: row.caption ?? '',
    items: [...(row.instagram_post_items ?? [])].sort((a: any, b: any) => a.position - b.position),
  };
}

// ---------------------------------------------------------------------------------------------
// Conexión
// ---------------------------------------------------------------------------------------------

export async function fetchInstagramConnection(): Promise<InstagramConnection | null> {
  const { data, error } = await supabaseAdmin.from('instagram_connection').select('*').eq('id', true).maybeSingle();
  if (error) throw new Error(error.message);
  return data as InstagramConnection | null;
}

export async function startInstagramConnection(): Promise<string> {
  const { data, error } = await supabaseAdmin.functions.invoke('instagram-auth', { body: { action: 'start' } });
  if (error) throw await functionError(error, 'No se pudo iniciar la conexión con Instagram.');
  return data.url as string;
}

export async function disconnectInstagram() {
  const { error } = await supabaseAdmin.functions.invoke('instagram-auth', { body: { action: 'disconnect' } });
  if (error) throw await functionError(error, 'No se pudo desconectar la cuenta.');
}

// ---------------------------------------------------------------------------------------------
// Carruseles
// ---------------------------------------------------------------------------------------------

const POST_SELECT = '*, instagram_post_items(id, position, costume_id, source_bucket, source_path, alt_text)';

export async function fetchInstagramPosts(fromIso: string, toIso: string): Promise<InstagramPost[]> {
  const { data, error } = await supabaseAdmin
    .from('instagram_posts')
    .select(POST_SELECT)
    .gte('scheduled_at', fromIso)
    .lte('scheduled_at', toIso)
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPost);
}

export async function fetchAttentionPosts(): Promise<InstagramPost[]> {
  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('instagram_posts')
    .select(POST_SELECT)
    .or(`status.eq.fallido,and(status.eq.pendiente,scheduled_at.lte.${in48h})`)
    .order('scheduled_at', { ascending: true })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPost);
}

async function replaceItems(postId: string, items: InstagramPostItem[]) {
  const { error: deleteError } = await supabaseAdmin.from('instagram_post_items').delete().eq('post_id', postId);
  if (deleteError) throw new Error(deleteError.message);
  if (!items.length) return;
  const { error } = await supabaseAdmin.from('instagram_post_items').insert(
    items.map((item, index) => ({
      post_id: postId,
      position: index,
      costume_id: item.costume_id,
      source_bucket: item.source_bucket,
      source_path: item.source_path,
      alt_text: item.alt_text?.trim() || null,
    }))
  );
  if (error) throw new Error(error.message);
}

export async function createInstagramPost(input: InstagramPostInput, userId: string | null) {
  const { data, error } = await supabaseAdmin
    .from('instagram_posts')
    .insert({
      source: input.source ?? 'manual',
      campaign_id: input.campaign_id ?? null,
      rule_id: input.rule_id ?? null,
      title: input.title ?? null,
      caption: input.caption,
      scheduled_at: input.scheduled_at,
      status: input.status,
      approved_at: input.status === 'programado' ? new Date().toISOString() : null,
      approved_by: input.status === 'programado' ? userId : null,
      created_by: userId,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  await replaceItems(data.id, input.items);
  return data.id as string;
}

export async function updateInstagramPost(postId: string, input: InstagramPostInput, userId: string | null) {
  const { error } = await supabaseAdmin
    .from('instagram_posts')
    .update({
      title: input.title ?? null,
      caption: input.caption,
      scheduled_at: input.scheduled_at,
      status: input.status,
      approved_at: input.status === 'programado' ? new Date().toISOString() : null,
      approved_by: input.status === 'programado' ? userId : null,
      attempts: 0,
      next_attempt_at: null,
      last_error: null,
      ig_container_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .in('status', ['borrador', 'pendiente', 'programado', 'fallido', 'cancelado']);
  if (error) throw new Error(error.message);
  await replaceItems(postId, input.items);
}

export async function approveInstagramPosts(postIds: string[], userId: string | null) {
  if (!postIds.length) return;
  const { error } = await supabaseAdmin
    .from('instagram_posts')
    .update({ status: 'programado', approved_at: new Date().toISOString(), approved_by: userId, updated_at: new Date().toISOString() })
    .in('id', postIds)
    .in('status', ['pendiente', 'borrador']);
  if (error) throw new Error(error.message);
}

export async function cancelInstagramPosts(postIds: string[]) {
  if (!postIds.length) return;
  const { error } = await supabaseAdmin
    .from('instagram_posts')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .in('id', postIds)
    .in('status', ['borrador', 'pendiente', 'programado', 'fallido']);
  if (error) throw new Error(error.message);
}

export async function retryInstagramPost(postId: string) {
  const { error } = await supabaseAdmin
    .from('instagram_posts')
    .update({
      status: 'programado',
      attempts: 0,
      next_attempt_at: null,
      last_error: null,
      ig_container_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('status', 'fallido');
  if (error) throw new Error(error.message);
}

export async function fetchPostLog(postId: string) {
  const { data, error } = await supabaseAdmin
    .from('instagram_publish_log')
    .select('level, message, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * "Publicar ahora": deja el carrusel programado para ya e invoca la tarea programada varias veces
 * (cada llamada prepara algunas imágenes 4:5 y, cuando están todas, publica).
 */
export async function publishInstagramPostNow(postId: string, userId: string | null, onProgress?: (text: string) => void) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from('instagram_posts')
    .update({
      status: 'programado',
      scheduled_at: now,
      approved_at: now,
      approved_by: userId,
      attempts: 0,
      next_attempt_at: null,
      last_error: null,
      updated_at: now,
    })
    .eq('id', postId)
    .in('status', ['borrador', 'pendiente', 'programado', 'fallido']);
  if (error) throw new Error(error.message);

  for (let round = 0; round < 8; round += 1) {
    onProgress?.(round === 0 ? 'Preparando imágenes...' : 'Publicando en Instagram...');
    const { data, error: invokeError } = await supabaseAdmin.functions.invoke('instagram-scheduler', {
      body: { post_id: postId },
    });
    if (invokeError) throw await functionError(invokeError, 'No se pudo publicar ahora. Intenta de nuevo.');
    if (data?.publish === 'sin_conexion') throw new Error('Conecta la cuenta de Instagram antes de publicar.');
    if (data?.publish === 'conexion_con_error') {
      throw new Error('El acceso a Instagram dejó de funcionar. Vuelve a conectar la cuenta en Instagram → Conexión.');
    }
    const result = data?.publish?.[postId];
    if (result === 'sin_acceso') {
      throw new Error('Instagram rechazó el acceso. Vuelve a conectar la cuenta; el carrusel quedó programado.');
    }
    if (result === 'publicado') return 'publicado' as const;
    if (result === 'fallido') return 'fallido' as const;
    if (result === 'reintento') return 'reintento' as const;
  }
  return 'en_proceso' as const;
}

// ---------------------------------------------------------------------------------------------
// Textos e imágenes
// ---------------------------------------------------------------------------------------------

export async function generateInstagramCaption(costumeIds: string[], theme?: string, extra?: string) {
  const { data, error } = await supabaseAdmin.functions.invoke('instagram-caption', {
    body: { costume_ids: costumeIds, theme, extra },
  });
  if (error) throw await functionError(error, 'Algo no salió bien al escribir el texto. Intenta de nuevo o escríbelo a mano.');
  return data.caption as string;
}

/** Sube una imagen propia (no del catálogo) para usarla en un carrusel. */
export async function uploadInstagramImage(file: File): Promise<InstagramPostItem> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) throw new Error('Formato no permitido. Usa JPG, PNG o WEBP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen supera 8 MB.');
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from('instagram-media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return { position: 0, costume_id: null, source_bucket: 'instagram-media', source_path: path, alt_text: null };
}

export const MAX_CAROUSEL_ITEMS = 10;

export interface CostumeGallery {
  items: InstagramPostItem[];
  /** Fotos que no caben en el carrusel (más de 10). */
  leftOut: number;
}

/**
 * Galería de cada disfraz en el orden del catálogo (foto principal y luego `sort_order`), lista para un carrusel
 * de un disfraz: máximo 10 fotos, con su texto alternativo.
 */
export async function fetchCostumeGalleries(costumeIds: string[]): Promise<Map<string, CostumeGallery>> {
  const galleries = new Map<string, CostumeGallery>();
  if (!costumeIds.length) return galleries;
  const { data, error } = await supabaseAdmin
    .from('costume_images')
    .select('costume_id, storage_path, is_primary, sort_order, alt_text')
    .in('costume_id', costumeIds)
    .order('sort_order', { ascending: true })
    .range(0, 9999);
  if (error) throw new Error(error.message);
  const byCostume = new Map<string, any[]>();
  (data ?? []).forEach((row: any) => byCostume.set(row.costume_id, [...(byCostume.get(row.costume_id) ?? []), row]));
  byCostume.forEach((rows, costumeId) => {
    const ordered = [...rows].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
    galleries.set(costumeId, {
      items: ordered.slice(0, MAX_CAROUSEL_ITEMS).map((row, position) => ({
        position,
        costume_id: costumeId,
        source_bucket: 'costume-images',
        source_path: row.storage_path,
        alt_text: row.alt_text ?? null,
      })),
      leftOut: Math.max(0, ordered.length - MAX_CAROUSEL_ITEMS),
    });
  });
  return galleries;
}

/** Texto alternativo de la foto principal de cada disfraz, para reutilizarlo en Instagram. */
export async function fetchPrimaryAltTexts(costumeIds: string[]) {
  if (!costumeIds.length) return new Map<string, string>();
  const { data, error } = await supabaseAdmin
    .from('costume_images')
    .select('costume_id, alt_text')
    .eq('is_primary', true)
    .in('costume_id', costumeIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).filter((row: any) => row.alt_text).map((row: any) => [row.costume_id, row.alt_text as string]));
}

// ---------------------------------------------------------------------------------------------
// Campañas
// ---------------------------------------------------------------------------------------------

export type CampaignStatus = 'activa' | 'pausada' | 'cancelada' | 'terminada';

export interface InstagramCampaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  weekdays: number[];
  publish_time: string;
  items_per_post: number | null;
  grouping: 'categoria' | 'mezclado' | 'destacados_primero' | 'por_disfraz';
  post_order: 'destacados_primero' | 'alternando';
  filters: Record<string, unknown>;
  milestones: unknown;
  requires_approval: boolean;
  include_new_costumes: boolean;
  status: CampaignStatus;
  state: { sin_fecha?: Array<{ costume_id: string; name: string; detected_at: string }> } | null;
  created_at: string;
  counts: Partial<Record<InstagramPostStatus, number>>;
}

export async function fetchCampaigns(): Promise<InstagramCampaign[]> {
  const { data, error } = await supabaseAdmin
    .from('instagram_campaigns')
    .select('*, instagram_posts(status)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => {
    const counts: Partial<Record<InstagramPostStatus, number>> = {};
    (row.instagram_posts ?? []).forEach((post: { status: InstagramPostStatus }) => {
      counts[post.status] = (counts[post.status] ?? 0) + 1;
    });
    const { instagram_posts: _posts, ...campaign } = row;
    return { ...campaign, counts } as InstagramCampaign;
  });
}

export interface NewCampaignInput {
  name: string;
  start_date: string;
  end_date: string;
  weekdays: number[];
  publish_time: string;
  items_per_post: number | null;
  grouping: InstagramCampaign['grouping'];
  post_order?: InstagramCampaign['post_order'];
  filters: Record<string, unknown>;
  milestones: unknown;
  requires_approval: boolean;
  include_new_costumes: boolean;
}

export async function createCampaign(input: NewCampaignInput, userId: string | null) {
  const { data, error } = await supabaseAdmin
    .from('instagram_campaigns')
    .insert({ ...input, created_by: userId })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function setCampaignStatus(campaignId: string, status: 'activa' | 'pausada' | 'cancelada') {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('instagram_campaigns').update({ status, updated_at: now }).eq('id', campaignId);
  if (error) throw new Error(error.message);

  if (status === 'cancelada') {
    const { error: postsError } = await supabaseAdmin
      .from('instagram_posts')
      .update({ status: 'cancelado', updated_at: now })
      .eq('campaign_id', campaignId)
      .in('status', ['borrador', 'pendiente', 'programado', 'fallido']);
    if (postsError) throw new Error(postsError.message);
  }

  if (status === 'activa') {
    // Lo que venció mientras estaba en pausa no se publica de golpe: vuelve a pendiente para reprogramar.
    const { error: overdueError } = await supabaseAdmin
      .from('instagram_posts')
      .update({ status: 'pendiente', updated_at: now })
      .eq('campaign_id', campaignId)
      .eq('status', 'programado')
      .lt('scheduled_at', now);
    if (overdueError) throw new Error(overdueError.message);
  }
}

/** Tallas por disfraz, para filtrar adulto/niño en las campañas. */
export async function fetchCostumeSizeKinds() {
  const { data, error } = await supabaseAdmin.from('costume_sizes').select('costume_id, size');
  if (error) throw new Error(error.message);
  const kinds = new Map<string, { adult: boolean; child: boolean }>();
  (data ?? []).forEach((row: any) => {
    const entry = kinds.get(row.costume_id) ?? { adult: false, child: false };
    if (/^\d+$/.test(String(row.size))) entry.child = true;
    else entry.adult = true;
    kinds.set(row.costume_id, entry);
  });
  return kinds;
}

// ---------------------------------------------------------------------------------------------
// Reglas recurrentes
// ---------------------------------------------------------------------------------------------

export type InstagramRuleKind = 'novedades' | 'mas_alquilados' | 'categoria_semana';
export type InstagramRuleCadence = 'semanal' | 'mensual';

export interface InstagramRule {
  id: string;
  kind: InstagramRuleKind;
  name: string;
  cadence: InstagramRuleCadence;
  /** 0 = domingo … 6 = sábado */
  weekday: number;
  publish_time: string;
  items_count: number;
  requires_approval: boolean;
  active: boolean;
  last_generated_for: string | null;
  created_at: string;
}

export type InstagramRuleInput = Pick<
  InstagramRule,
  'kind' | 'name' | 'cadence' | 'weekday' | 'publish_time' | 'items_count' | 'requires_approval' | 'active'
>;

export const RULE_KIND_LABELS: Record<InstagramRuleKind, { title: string; description: string; cadence: InstagramRuleCadence }> = {
  novedades: {
    title: 'Novedades',
    description: 'Los disfraces agregados desde la última publicación de la regla. Si hay menos de 2, esa semana no se publica.',
    cadence: 'semanal',
  },
  mas_alquilados: {
    title: 'Los más alquilados del mes',
    description: 'Los disfraces con más alquileres del mes anterior, según el histórico de Insights.',
    cadence: 'mensual',
  },
  categoria_semana: {
    title: 'Categoría de la semana',
    description: 'Rota entre las categorías con al menos 2 disfraces disponibles con foto.',
    cadence: 'semanal',
  },
};

export async function fetchRules(): Promise<InstagramRule[]> {
  const { data, error } = await supabaseAdmin.from('instagram_rules').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as InstagramRule[];
}

export async function saveRule(input: InstagramRuleInput, ruleId?: string) {
  const payload = { ...input, name: input.name.trim() || RULE_KIND_LABELS[input.kind].title, updated_at: new Date().toISOString() };
  const { error } = ruleId
    ? await supabaseAdmin.from('instagram_rules').update(payload).eq('id', ruleId)
    : await supabaseAdmin.from('instagram_rules').insert(payload);
  if (error) throw new Error(error.message);
}

export async function deleteRule(ruleId: string) {
  const { error } = await supabaseAdmin.from('instagram_rules').delete().eq('id', ruleId);
  if (error) throw new Error(error.message);
}

/** Próxima fecha de la regla en hora de Colombia (misma lógica que la tarea programada). */
export function nextRuleOccurrence(rule: Pick<InstagramRule, 'cadence' | 'weekday' | 'publish_time'>, now = new Date()) {
  const minTime = now.getTime() + 30 * 60 * 1000;
  const today = bogotaDayKey(now.toISOString());
  for (let offset = 0; offset < 40; offset += 1) {
    const day = new Date(`${today}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + offset);
    if (day.getUTCDay() !== rule.weekday) continue;
    if (rule.cadence === 'mensual' && day.getUTCDate() > 7) continue;
    const iso = bogotaDateTimeToIso(day.toISOString().slice(0, 10), rule.publish_time);
    if (new Date(iso).getTime() > minTime) return iso;
  }
  return null;
}
