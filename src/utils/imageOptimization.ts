/**
 * Compresión de imágenes en el navegador antes de subirlas a Supabase Storage.
 * Objetivo: evitar subir PNG/JPG crudos de varios MB que luego se sirven tal
 * cual en catálogo/ficha (ver docs/specs/specs_backlog/optimizacion_rendimiento.spec.md).
 *
 * No agrega dependencias: usa Canvas API, disponible en todos los navegadores
 * modernos. Si algo falla o no hay soporte, se devuelve el archivo original
 * sin tocar — nunca debe bloquear una subida.
 */

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.8;

export interface CompressImageOptions {
  maxWidth?: number;
  quality?: number;
}

export async function compressImageFile(
  file: File,
  options?: CompressImageOptions
): Promise<File> {
  // Los SVG son vectoriales: no hay nada que redimensionar/recomprimir.
  if (file.type === 'image/svg+xml') {
    return file;
  }

  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options?.quality ?? DEFAULT_QUALITY;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    // El navegador no soporta codificar WebP vía canvas: mantener el original.
    if (!blob) {
      return file;
    }

    const baseName = file.name.replace(/\.[^./\\]+$/, '');
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  } catch (error) {
    console.error('[imageOptimization] No se pudo comprimir la imagen, se sube el original', error);
    return file;
  }
}

// ---------------------------------------------------------------------------
// Flujo "Nuevo disfraz desde foto" (spec crear_disfraz_desde_foto).
// ---------------------------------------------------------------------------

const AI_INPUT_MAX_SIDE = 2048;
/** Tamaño final de la foto de catálogo: 3:4, igual que docs/prompts/editar foto_catalogo.prompt.md. */
export const CATALOG_IMAGE_WIDTH = 800;
export const CATALOG_IMAGE_HEIGHT = 1067;
/** Gris del fondo de estudio del prompt de catálogo, usado si hay que completar bordes. */
const CATALOG_BACKGROUND = '#E8E8E8';

/**
 * Decodifica cualquier imagen que el navegador sepa leer. Primero `createImageBitmap`; si falla
 * (p. ej. HEIC en algunos navegadores), un <img>, que en Safari sí decodifica HEIC.
 */
async function decodeImage(source: Blob): Promise<{ image: CanvasImageSource; width: number; height: number; release: () => void }> {
  try {
    const bitmap = await createImageBitmap(source);
    return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  } catch {
    const url = URL.createObjectURL(source);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('No se pudo leer la foto.'));
        element.src = url;
      });
      return { image: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la foto.'))),
      'image/jpeg',
      quality
    );
  });
}

/**
 * Prepara la foto tomada o elegida en el celular para enviarla a la IA: JPG, lado mayor ≤ 2048 px.
 * Convierte HEIC (iPhone) y reduce el peso para que la subida sea rápida.
 */
export async function prepareImageForAi(file: File): Promise<File> {
  const decoded = await decodeImage(file);
  try {
    const scale = Math.min(1, AI_INPUT_MAX_SIDE / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(decoded.width * scale);
    canvas.height = Math.round(decoded.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo procesar la foto.');
    }
    ctx.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToJpeg(canvas, 0.9);
    return new File([blob], 'foto-disfraz.jpg', { type: 'image/jpeg' });
  } finally {
    decoded.release();
  }
}

/**
 * Lleva la foto editada por la IA al tamaño de catálogo (800 × 1067, 3:4). Si la proporción no es
 * exactamente 3:4, se completa con el gris del fondo en vez de recortar, para no cortar el disfraz.
 */
export async function toCatalogImage(source: Blob): Promise<File> {
  const decoded = await decodeImage(source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = CATALOG_IMAGE_WIDTH;
    canvas.height = CATALOG_IMAGE_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo procesar la foto.');
    }
    ctx.fillStyle = CATALOG_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / decoded.width, canvas.height / decoded.height);
    const width = decoded.width * scale;
    const height = decoded.height * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const blob = await canvasToJpeg(canvas, 0.92);
    return new File([blob], 'disfraz-catalogo.jpg', { type: 'image/jpeg' });
  } finally {
    decoded.release();
  }
}
