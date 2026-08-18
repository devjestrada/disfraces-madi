/**
 * Migra las imágenes ya subidas a Supabase Storage (buckets `costume-images`
 * y `site-assets`) a WebP redimensionado, para las que quedaron subidas en
 * su formato/tamaño original antes de que `uploadCostumeImage`/
 * `uploadSiteAsset` empezaran a comprimir en el momento de subida
 * (ver src/utils/imageOptimization.ts y
 * docs/specs/specs_backlog/optimizacion_rendimiento.spec.md sección 1.2).
 *
 * Este script NO se ejecuta como parte del build ni de ningún flujo
 * automático. Es una migración manual de una sola vez (o repetible: los
 * objetos ya optimizados se saltan).
 *
 * Requiere una Service Role Key de Supabase (bypasea RLS para poder
 * reescribir imágenes de cualquier disfraz/asset), distinta de la anon key
 * que usa el resto de la app. Se lee de la raíz del repo (`.env`, NUNCA
 * commiteado — ver `.gitignore`), con estas claves:
 *
 *   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
 *
 * Uso:
 *   npm run optimize-images            # migra todo lo pendiente
 *   npm run optimize-images -- --dry-run   # solo reporta qué haría, no escribe nada
 */

import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Apunta explícitamente al `.env` de la raíz del repo (independiente del
// directorio desde el que se invoque `tsx`/`npm run`), en vez de depender
// del `process.cwd()` implícito de `dotenv/config`.
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
const dotenvResult = loadDotenv({ path: envPath });

if (dotenvResult.error) {
  console.warn(
    `[optimize-images] No se pudo leer ${envPath} (${dotenvResult.error.message}); se intentará usar variables de entorno ya exportadas.`
  );
}

const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;
// Si un objeto ya es .webp y pesa menos que esto, se asume optimizado y se
// salta (permite correr el script más de una vez sin reprocesar de más).
const SKIP_WEBP_UNDER_BYTES = 300 * 1024;

const DRY_RUN = process.argv.includes('--dry-run');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '[optimize-images] Faltan VITE_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno. Abortando.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

interface StorageTarget {
  bucket: string;
  table: string;
  idColumn: string;
  pathColumn: string;
  id: string | number;
  storagePath: string;
}

async function fetchTargets(): Promise<StorageTarget[]> {
  const targets: StorageTarget[] = [];

  const { data: costumeImages, error: costumeImagesError } = await supabase
    .from('costume_images')
    .select('id, storage_path');
  if (costumeImagesError) {
    throw new Error(`Error consultando costume_images: ${costumeImagesError.message}`);
  }
  for (const row of costumeImages ?? []) {
    targets.push({
      bucket: 'costume-images',
      table: 'costume_images',
      idColumn: 'id',
      pathColumn: 'storage_path',
      id: row.id,
      storagePath: row.storage_path,
    });
  }

  const { data: siteAssets, error: siteAssetsError } = await supabase
    .from('site_assets')
    .select('key, storage_path');
  if (siteAssetsError) {
    throw new Error(`Error consultando site_assets: ${siteAssetsError.message}`);
  }
  for (const row of siteAssets ?? []) {
    targets.push({
      bucket: 'site-assets',
      table: 'site_assets',
      idColumn: 'key',
      pathColumn: 'storage_path',
      id: row.key,
      storagePath: row.storage_path,
    });
  }

  return targets;
}

function shouldSkip(storagePath: string, sizeBytes: number): boolean {
  if (storagePath.toLowerCase().endsWith('.svg')) {
    return true; // vectorial, nada que optimizar
  }
  if (storagePath.toLowerCase().endsWith('.webp') && sizeBytes < SKIP_WEBP_UNDER_BYTES) {
    return true; // ya parece optimizado
  }
  return false;
}

function replaceExtensionWithWebp(storagePath: string): string {
  return storagePath.replace(/\.[^./\\]+$/, '.webp');
}

async function processTarget(target: StorageTarget) {
  const { bucket, table, idColumn, pathColumn, id, storagePath } = target;

  const { data: original, error: downloadError } = await supabase.storage
    .from(bucket)
    .download(storagePath);

  if (downloadError || !original) {
    console.warn(`[skip] ${bucket}/${storagePath}: no se pudo descargar (${downloadError?.message})`);
    return;
  }

  const originalBuffer = Buffer.from(await original.arrayBuffer());

  if (shouldSkip(storagePath, originalBuffer.byteLength)) {
    console.log(`[skip] ${bucket}/${storagePath}: ya optimizado o no aplica`);
    return;
  }

  let optimizedBuffer: Buffer;
  try {
    optimizedBuffer = await sharp(originalBuffer)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    console.warn(`[skip] ${bucket}/${storagePath}: error procesando con sharp (${(err as Error).message})`);
    return;
  }

  const newPath = replaceExtensionWithWebp(storagePath);
  const before = originalBuffer.byteLength;
  const after = optimizedBuffer.byteLength;
  const savedPct = Math.round((1 - after / before) * 100);

  if (DRY_RUN) {
    console.log(
      `[dry-run] ${bucket}/${storagePath} -> ${newPath} (${(before / 1024).toFixed(0)}kB -> ${(after / 1024).toFixed(0)}kB, -${savedPct}%)`
    );
    return;
  }

  // 1) Subir el nuevo objeto optimizado.
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(newPath, optimizedBuffer, { contentType: 'image/webp', upsert: true });

  if (uploadError) {
    console.error(`[error] ${bucket}/${storagePath}: no se pudo subir la versión optimizada (${uploadError.message})`);
    return;
  }

  // 2) Actualizar la fila en la tabla para que apunte al nuevo path.
  const { error: updateError } = await supabase
    .from(table)
    .update({ [pathColumn]: newPath })
    .eq(idColumn, id);

  if (updateError) {
    console.error(
      `[error] ${table}.${idColumn}=${id}: no se pudo actualizar ${pathColumn}, se deja el objeto nuevo pero NO se borra el original (${updateError.message})`
    );
    return;
  }

  // 3) Solo tras confirmar el update, borrar el objeto original (si cambió de nombre).
  if (newPath !== storagePath) {
    const { error: removeError } = await supabase.storage.from(bucket).remove([storagePath]);
    if (removeError) {
      console.warn(`[warn] ${bucket}/${storagePath}: no se pudo borrar el original (${removeError.message})`);
    }
  }

  console.log(
    `[ok] ${bucket}/${storagePath} -> ${newPath} (${(before / 1024).toFixed(0)}kB -> ${(after / 1024).toFixed(0)}kB, -${savedPct}%)`
  );
}

async function main() {
  console.log(`[optimize-images] Modo: ${DRY_RUN ? 'dry-run (no escribe nada)' : 'ejecución real'}`);

  const targets = await fetchTargets();
  console.log(`[optimize-images] ${targets.length} objetos encontrados en costume_images + site_assets`);

  for (const target of targets) {
    await processTarget(target);
  }

  console.log('[optimize-images] Listo.');
}

main().catch((err) => {
  console.error('[optimize-images] Error fatal:', err);
  process.exit(1);
});
