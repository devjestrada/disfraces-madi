import {
  createCarouselContainer,
  createCarouselItem,
  getContainerStatus,
  getMediaPermalink,
  getPublishingQuota,
  InstagramApiError,
  isAuthError,
  publishContainer,
} from '../_shared/instagram.ts';
import { markConnectionBroken } from './token.ts';
import { log, publicUrl, type SchedulerContext } from './context.ts';
import { getVariantMap } from './variants.ts';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MIN = [5, 15, 45];
const LOCK_MINUTES = 10;
/** Si a la hora de publicar faltan imágenes 4:5, se espera hasta este margen antes de marcar fallido. */
const MAX_WAIT_FOR_IMAGES_MIN = 60;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Toma el carrusel de forma exclusiva (programado, o "publicando" con el bloqueo vencido). */
async function lockPost(ctx: SchedulerContext, post: any) {
  const lockedUntil = new Date(ctx.now.getTime() + LOCK_MINUTES * 60 * 1000).toISOString();
  let query = ctx.db
    .from('instagram_posts')
    .update({ status: 'publicando', locked_until: lockedUntil, updated_at: ctx.now.toISOString() })
    .eq('id', post.id)
    .eq('status', post.status);
  if (post.status === 'publicando') {
    query = query.lt('locked_until', ctx.now.toISOString());
  }
  const { data } = await query.select('id');
  return Boolean(data && data.length);
}

async function markFailedOrRetry(ctx: SchedulerContext, post: any, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (isAuthError(error)) {
    // El problema es la conexión, no el carrusel: vuelve a programado sin gastar intentos.
    await markConnectionBroken(ctx, message);
    await ctx.db
      .from('instagram_posts')
      .update({ status: 'programado', locked_until: null, last_error: message, updated_at: ctx.now.toISOString() })
      .eq('id', post.id);
    await log(ctx, post.id, 'error', `Sin acceso a Instagram, se publicará al reconectar: ${message}`);
    return 'sin_acceso' as const;
  }
  const transient = error instanceof InstagramApiError ? error.transient : true;
  const attempts = (post.attempts ?? 0) + 1;
  if (transient && attempts < MAX_ATTEMPTS) {
    const delay = RETRY_DELAYS_MIN[attempts - 1] ?? 45;
    await ctx.db
      .from('instagram_posts')
      .update({
        status: 'programado',
        attempts,
        last_error: message,
        locked_until: null,
        next_attempt_at: new Date(ctx.now.getTime() + delay * 60 * 1000).toISOString(),
        updated_at: ctx.now.toISOString(),
      })
      .eq('id', post.id);
    await log(ctx, post.id, 'error', `Intento ${attempts} falló, se reintenta en ${delay} min: ${message}`);
    return 'reintento' as const;
  }
  await ctx.db
    .from('instagram_posts')
    .update({
      status: 'fallido',
      attempts,
      last_error: message,
      locked_until: null,
      updated_at: ctx.now.toISOString(),
    })
    .eq('id', post.id);
  await log(ctx, post.id, 'error', `No se pudo publicar: ${message}`);
  return 'fallido' as const;
}

async function markPublished(ctx: SchedulerContext, postId: string, mediaId: string | null, token: string) {
  const permalink = mediaId ? await getMediaPermalink(mediaId, token) : null;
  await ctx.db
    .from('instagram_posts')
    .update({
      status: 'publicado',
      ig_media_id: mediaId,
      permalink,
      published_at: ctx.now.toISOString(),
      locked_until: null,
      last_error: null,
      updated_at: ctx.now.toISOString(),
    })
    .eq('id', postId);
  await log(ctx, postId, 'info', `Publicado${permalink ? `: ${permalink}` : ''}`);
}

async function waitForContainer(containerId: string, token: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { statusCode, status } = await getContainerStatus(containerId, token);
    if (statusCode === 'FINISHED' || statusCode === 'PUBLISHED') return statusCode;
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw new InstagramApiError(`Instagram no pudo procesar el carrusel (${statusCode}${status ? `: ${status}` : ''})`, 400);
    }
    await sleep(2000);
  }
  throw new InstagramApiError('Instagram sigue procesando el carrusel; se reintentará.', 503, undefined, true);
}

export async function publishPost(ctx: SchedulerContext, post: any, igUserId: string, token: string) {
  if (!(await lockPost(ctx, post))) return 'ocupado' as const;

  try {
    // Ya tenía contenedor de un intento anterior: evitar publicar dos veces.
    if (post.ig_container_id) {
      try {
        const { statusCode } = await getContainerStatus(post.ig_container_id, token);
        if (statusCode === 'PUBLISHED') {
          await markPublished(ctx, post.id, post.ig_media_id ?? null, token);
          return 'publicado' as const;
        }
        if (statusCode === 'FINISHED') {
          const mediaId = await publishContainer(igUserId, token, post.ig_container_id);
          await markPublished(ctx, post.id, mediaId, token);
          return 'publicado' as const;
        }
      } catch {
        // Contenedor vencido o inválido: se crea uno nuevo.
      }
    }

    const items = [...(post.instagram_post_items ?? [])].sort((a: any, b: any) => a.position - b.position);
    if (items.length < 2 || items.length > 10) {
      throw new InstagramApiError('El carrusel debe tener entre 2 y 10 imágenes.', 400);
    }

    const variants = await getVariantMap(ctx, items);
    const missing = items.filter((item: any) => !variants.has(`${item.source_bucket}/${item.source_path}`));
    if (missing.length) {
      const late = ctx.now.getTime() - new Date(post.scheduled_at).getTime() > MAX_WAIT_FOR_IMAGES_MIN * 60 * 1000;
      if (late) {
        throw new InstagramApiError('No se pudieron preparar las imágenes 4:5 a tiempo.', 400);
      }
      await ctx.db
        .from('instagram_posts')
        .update({ status: 'programado', locked_until: null, updated_at: ctx.now.toISOString() })
        .eq('id', post.id);
      return 'esperando_imagenes' as const;
    }

    const quota = await getPublishingQuota(igUserId, token).catch(() => null);
    if (quota && quota.used >= quota.total) {
      throw new InstagramApiError('Se alcanzó el límite diario de publicaciones de Instagram.', 429, 4, true);
    }

    const children: string[] = [];
    for (const item of items) {
      const variantPath = variants.get(`${item.source_bucket}/${item.source_path}`)!;
      children.push(await createCarouselItem(igUserId, token, publicUrl(ctx, 'instagram-media', variantPath), item.alt_text));
    }
    const containerId = await createCarouselContainer(igUserId, token, children, post.caption ?? '');
    await ctx.db.from('instagram_posts').update({ ig_container_id: containerId }).eq('id', post.id);

    await waitForContainer(containerId, token);
    const mediaId = await publishContainer(igUserId, token, containerId);
    await markPublished(ctx, post.id, mediaId, token);
    return 'publicado' as const;
  } catch (error) {
    return markFailedOrRetry(ctx, post, error);
  }
}

/** Publica los carruseles programados cuya hora ya llegó (o uno puntual con "Publicar ahora"). */
export async function publishDuePosts(
  ctx: SchedulerContext,
  igUserId: string,
  token: string,
  options: { onlyPostId?: string; maxPosts: number }
) {
  const nowIso = ctx.now.toISOString();
  let query = ctx.db
    .from('instagram_posts')
    .select('*, instagram_post_items(*)')
    .order('scheduled_at', { ascending: true })
    .limit(options.maxPosts + 25);
  if (options.onlyPostId) {
    query = query.eq('id', options.onlyPostId).in('status', ['programado', 'publicando']);
  } else {
    query = query
      .lte('scheduled_at', nowIso)
      .or(`and(status.eq.programado,or(next_attempt_at.is.null,next_attempt_at.lte.${nowIso})),and(status.eq.publicando,locked_until.lt.${nowIso})`);
  }
  const { data: posts, error } = await query;
  if (error) throw new Error(error.message);

  // Los carruseles de una campaña en pausa esperan a que se reanude (salvo "Publicar ahora").
  let pausedCampaigns = new Set<string>();
  if (!options.onlyPostId && (posts ?? []).some((post: any) => post.campaign_id)) {
    const { data: paused } = await ctx.db.from('instagram_campaigns').select('id').eq('status', 'pausada');
    pausedCampaigns = new Set((paused ?? []).map((row: any) => row.id as string));
  }

  const results: Record<string, string> = {};
  const due = (posts ?? []).filter((post: any) => !(post.campaign_id && pausedCampaigns.has(post.campaign_id)));
  for (const post of due.slice(0, options.maxPosts)) {
    results[post.id] = await publishPost(ctx, post, igUserId, token);
  }
  return results;
}
