import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';
import { toCatalogImage } from '../utils/imageOptimization';

/** Respuesta de la Edge Function `extract-costume-data` (ver supabase/functions/_shared/prompts.ts). */
export interface ExtractedCostumeData {
  nombre: string;
  categoria: string;
  disenadora: string;
  precio_alquiler: number | null;
  precio_venta: number | null;
  precio_deposito: number | null;
  descripcion: string;
  detalles_visibles: string[];
  telas_existentes: string[];
  telas_nuevas: string[];
  accesorios_existentes: string[];
  accesorios_nuevos: string[];
  tallas: string[];
  texto_alternativo: string;
  notas_adicionales: string;
}

/** Lo que entrega el asistente "Desde foto" al formulario del panel. */
export interface AiCostumeDraft {
  /** Foto editada, ya en formato de catálogo (800 × 1067). */
  photo: File;
  altText: string;
  extracted: ExtractedCostumeData | null;
}

async function toFriendlyError(error: unknown, fallback: string): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string') {
        return new Error(body.error);
      }
    } catch {
      // La respuesta no era JSON: usar el mensaje genérico.
    }
  }
  return new Error(fallback);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

/** Envía la foto a la Edge Function `edit-costume-photo` y devuelve la foto de catálogo (800 × 1067). */
export async function editCostumePhoto(photo: File): Promise<File> {
  const body = new FormData();
  body.append('image', photo, photo.name);

  const { data, error } = await supabaseAdmin.functions.invoke('edit-costume-photo', { body });
  if (error) {
    throw await toFriendlyError(error, 'Algo no salió bien al editar la foto. Intenta de nuevo o toma otra.');
  }
  if (!data?.image_base64) {
    throw new Error('Algo no salió bien al editar la foto. Intenta de nuevo o toma otra.');
  }

  return toCatalogImage(base64ToBlob(data.image_base64, data.mime_type ?? 'image/jpeg'));
}

/** Envía la descripción a la Edge Function `extract-costume-data` y devuelve los datos sugeridos. */
export async function extractCostumeData(text: string): Promise<ExtractedCostumeData> {
  const { data, error } = await supabaseAdmin.functions.invoke('extract-costume-data', { body: { text } });
  if (error) {
    throw await toFriendlyError(
      error,
      'Algo no salió bien al leer la descripción. Intenta de nuevo o llena el formulario a mano.'
    );
  }
  return data as ExtractedCostumeData;
}
