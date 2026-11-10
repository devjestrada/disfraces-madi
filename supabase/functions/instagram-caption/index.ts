// Genera el texto de un carrusel con IA (solo admins).
// POST { costume_ids: string[], theme?: string, extra?: string } → { caption }
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';
import { enforceHourlyLimit, logUsage, requireAdmin, safetyIdentifier } from '../_shared/admin.ts';
import { generateCaption, loadCaptionCostumes } from '../_shared/captions.ts';

const MAX_CAPTIONS_PER_HOUR = 120;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Método no permitido.', 405);

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const costumeIds: string[] = Array.isArray(body.costume_ids)
      ? body.costume_ids.filter((id: unknown) => typeof id === 'string').slice(0, 10)
      : [];
    const theme = typeof body.theme === 'string' ? body.theme.slice(0, 200) : null;
    const extra = typeof body.extra === 'string' ? body.extra.slice(0, 500) : null;

    const limited = await enforceHourlyLimit(ctx, 'caption', MAX_CAPTIONS_PER_HOUR);
    if (limited) return limited;

    const costumes = await loadCaptionCostumes(ctx.userClient, costumeIds);
    const { caption, model } = await generateCaption({
      costumes,
      theme,
      extraInstructions: extra,
      safetyIdentifier: await safetyIdentifier(ctx.userId),
    });
    await logUsage(ctx, 'caption', model);
    return jsonResponse({ caption });
  } catch (error) {
    console.error('[instagram-caption] error', error);
    return errorResponse('Algo no salió bien al escribir el texto. Intenta de nuevo o escríbelo a mano.', 502);
  }
});
