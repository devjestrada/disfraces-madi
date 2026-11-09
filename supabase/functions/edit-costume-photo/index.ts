// Edita con IA (OpenAI Images API) la foto de un disfraz con el estilo de catálogo.
// Spec: docs/specs/.../crear_disfraz_desde_foto.spec.md
//
// Entrada: multipart/form-data con el campo `image` (JPG/PNG/WEBP, ≤ 5 MB).
// Salida: { image_base64, mime_type } — la imagen editada en 3:4. No se guarda nada en Supabase:
// el panel la persiste solo cuando se guarda el disfraz.
//
// Secretos: OPENAI_API_KEY (obligatorio), OPENAI_IMAGE_MODEL (por defecto gpt-image-2),
// OPENAI_IMAGE_QUALITY (low | medium | high; por defecto medium).

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';
import { enforceHourlyLimit, logUsage, requireAdmin, safetyIdentifier } from '../_shared/admin.ts';
import { CATALOG_PHOTO_PROMPT } from '../_shared/prompts.ts';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_EDITS_PER_HOUR = 20;
// 3:4 exacto, múltiplos de 16 (requisito de los tamaños personalizados de GPT Image).
const OUTPUT_SIZE = '960x1280';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Método no permitido.', 405);
  }

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) {
      return ctx;
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error('[edit-costume-photo] falta OPENAI_API_KEY');
      return errorResponse('La edición con IA aún no está configurada. Revisa los secretos de Supabase.', 500);
    }
    const model = Deno.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-2';
    const quality = Deno.env.get('OPENAI_IMAGE_QUALITY') || 'medium';

    const limited = await enforceHourlyLimit(ctx, 'photo_edit', MAX_EDITS_PER_HOUR);
    if (limited) {
      return limited;
    }

    let image: File | null = null;
    try {
      const form = await req.formData();
      const value = form.get('image');
      image = value instanceof File ? value : null;
    } catch {
      image = null;
    }
    if (!image) {
      return errorResponse('No recibimos la foto. Intenta de nuevo.', 400);
    }
    if (!ALLOWED_TYPES.has(image.type)) {
      return errorResponse('Formato no permitido. Usa una foto JPG, PNG o WEBP.', 400);
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return errorResponse('La foto pesa más de 5 MB. Intenta con otra.', 400);
    }

    const body = new FormData();
    body.append('model', model);
    body.append('prompt', CATALOG_PHOTO_PROMPT);
    body.append('image[]', image, image.name || 'foto.jpg');
    body.append('size', OUTPUT_SIZE);
    body.append('quality', quality);
    body.append('output_format', 'jpeg');
    body.append('output_compression', '90');
    body.append('n', '1');
    body.append('safety_identifier', await safetyIdentifier(ctx.userId));

    const openaiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    });

    if (!openaiResponse.ok) {
      const detail = await openaiResponse.text();
      console.error('[edit-costume-photo] OpenAI respondió', openaiResponse.status, detail);
      if (openaiResponse.status === 400 && /safety|moderation/i.test(detail)) {
        return errorResponse('La IA no pudo editar esta foto. Prueba con otra toma.', 422);
      }
      return errorResponse('Algo no salió bien al editar la foto. Intenta de nuevo o toma otra.', 502);
    }

    const result = await openaiResponse.json();
    const imageBase64: string | undefined = result?.data?.[0]?.b64_json;
    if (!imageBase64) {
      console.error('[edit-costume-photo] respuesta sin imagen', JSON.stringify(result).slice(0, 500));
      return errorResponse('Algo no salió bien al editar la foto. Intenta de nuevo o toma otra.', 502);
    }

    await logUsage(ctx, 'photo_edit', model);

    return jsonResponse({ image_base64: imageBase64, mime_type: 'image/jpeg' });
  } catch (error) {
    console.error('[edit-costume-photo] error inesperado', error);
    return errorResponse('Algo no salió bien al editar la foto. Intenta de nuevo o toma otra.', 500);
  }
});
