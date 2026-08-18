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
