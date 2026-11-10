import { renderInstagramVariant } from '../_shared/imaging.ts';
import type { SchedulerContext } from './context.ts';

const VARIANT_BUCKET = 'instagram-media';

async function variantPathFor(bucket: string, path: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${bucket}/${path}`));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `variants/${hex.slice(0, 32)}.jpg`;
}

export async function getVariantMap(ctx: SchedulerContext, items: Array<{ source_bucket: string; source_path: string }>) {
  const map = new Map<string, string>();
  if (!items.length) return map;
  const paths = Array.from(new Set(items.map((item) => item.source_path)));
  const { data } = await ctx.db
    .from('instagram_image_variants')
    .select('source_bucket, source_path, variant_path')
    .in('source_path', paths);
  (data ?? []).forEach((row: any) => map.set(`${row.source_bucket}/${row.source_path}`, row.variant_path));
  return map;
}

/** Genera la versión 4:5 de una imagen de origen y la registra. */
export async function renderVariant(ctx: SchedulerContext, bucket: string, path: string) {
  const { data: file, error } = await ctx.db.storage.from(bucket).download(path);
  if (error || !file) throw new Error(`No se pudo descargar ${bucket}/${path}: ${error?.message ?? 'sin archivo'}`);
  const jpeg = await renderInstagramVariant(await file.arrayBuffer());
  const variantPath = await variantPathFor(bucket, path);
  const { error: uploadError } = await ctx.db.storage
    .from(VARIANT_BUCKET)
    .upload(variantPath, jpeg, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw new Error(`No se pudo guardar la imagen 4:5: ${uploadError.message}`);
  await ctx.db
    .from('instagram_image_variants')
    .upsert({ source_bucket: bucket, source_path: path, variant_path: variantPath }, { onConflict: 'source_bucket,source_path' });
  return variantPath;
}

/**
 * Prepara las imágenes 4:5 que faltan para los carruseles próximos. Hace pocas por pasada para no
 * superar el tiempo de CPU de una Edge Function; el cron las completa en pasadas sucesivas.
 */
export async function prepareUpcomingVariants(ctx: SchedulerContext, maxRenders: number, onlyPostId?: string) {
  const horizon = new Date(ctx.now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  let query = ctx.db
    .from('instagram_posts')
    .select('id, instagram_post_items(source_bucket, source_path)')
    .in('status', ['pendiente', 'programado', 'publicando'])
    .order('scheduled_at', { ascending: true })
    .limit(30);
  query = onlyPostId ? query.eq('id', onlyPostId) : query.lte('scheduled_at', horizon);
  const { data: posts, error } = await query;
  if (error) throw new Error(error.message);

  const items = (posts ?? []).flatMap((post: any) => post.instagram_post_items ?? []);
  const existing = await getVariantMap(ctx, items);
  const missing: Array<{ bucket: string; path: string }> = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = `${item.source_bucket}/${item.source_path}`;
    if (!existing.has(key) && !seen.has(key)) {
      seen.add(key);
      missing.push({ bucket: item.source_bucket, path: item.source_path });
    }
  }

  let rendered = 0;
  const failures: string[] = [];
  for (const entry of missing.slice(0, maxRenders)) {
    try {
      await renderVariant(ctx, entry.bucket, entry.path);
      rendered += 1;
    } catch (renderError) {
      failures.push(renderError instanceof Error ? renderError.message : String(renderError));
    }
  }
  return { rendered, pending: Math.max(0, missing.length - rendered), failures };
}
