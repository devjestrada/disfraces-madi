// Conexión de la cuenta de Instagram desde el panel (solo admins).
// POST { action: 'start' } → { url }: enlace de autorización de Instagram con state firmado.
// POST { action: 'disconnect' } → borra la conexión y el token.
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin.ts';
import { authorizeUrl, signState, isMetaAppConfigured } from '../_shared/instagram.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Método no permitido.', 405);

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    let action = '';
    try {
      action = (await req.json())?.action ?? '';
    } catch {
      action = '';
    }

    if (action === 'start') {
      if (!isMetaAppConfigured() || !Deno.env.get('SITE_URL')) {
        return errorResponse('La conexión con Instagram aún no está configurada. Revisa los secretos de Supabase.', 500);
      }
      return jsonResponse({ url: authorizeUrl(await signState(ctx.userId)) });
    }

    if (action === 'disconnect') {
      await ctx.serviceClient.from('instagram_tokens').delete().eq('id', true);
      await ctx.serviceClient.from('instagram_connection').delete().eq('id', true);
      return jsonResponse({ ok: true });
    }

    return errorResponse('Acción no válida.', 400);
  } catch (error) {
    console.error('[instagram-auth] error inesperado', error);
    return errorResponse('Algo no salió bien con la conexión de Instagram. Intenta de nuevo.', 500);
  }
});
