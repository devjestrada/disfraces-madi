// Tarea programada de Instagram. La invoca pg_cron cada 5 minutos (encabezado x-cron-secret) y el panel
// con "Publicar ahora" (sesión de admin, body { post_id }).
// 1. Comprueba (cada hora) que el acceso a Instagram sigue funcionando; si no, no publica.
// 2. Genera carruseles de reglas y suma disfraces nuevos a campañas activas.
// 3. Prepara las imágenes 4:5 que faltan (pocas por pasada).
// 4. Publica los carruseles programados cuya hora llegó.
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/admin.ts';
import { createSchedulerContext, getConnection } from './context.ts';
import { checkConnection } from './token.ts';
import { prepareUpcomingVariants } from './variants.ts';
import { publishDuePosts } from './publisher.ts';
import { runAutomations } from './automations.ts';

const RENDERS_PER_RUN = Number(Deno.env.get('INSTAGRAM_RENDERS_PER_RUN') || 2);

async function authorize(req: Request): Promise<{ via: 'cron' | 'admin' } | Response> {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret');
  if (cronSecret && provided && provided === cronSecret) return { via: 'cron' };
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;
  return { via: 'admin' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Método no permitido.', 405);

  try {
    const auth = await authorize(req);
    if (auth instanceof Response) return auth;

    let onlyPostId: string | undefined;
    try {
      const body = await req.json();
      onlyPostId = typeof body?.post_id === 'string' ? body.post_id : undefined;
    } catch {
      onlyPostId = undefined;
    }

    const ctx = createSchedulerContext();
    const summary: Record<string, unknown> = { via: auth.via };

    if (!onlyPostId) {
      summary.automations = await runAutomations(ctx).catch((error) => ({ error: String(error) }));
    }

    summary.images = await prepareUpcomingVariants(ctx, RENDERS_PER_RUN, onlyPostId);

    const connection = await getConnection(ctx);
    if (!connection) {
      summary.publish = 'sin_conexion';
      return jsonResponse(summary);
    }
    if (!(await checkConnection(ctx, connection.connection, connection.token))) {
      summary.publish = 'conexion_con_error';
      return jsonResponse(summary);
    }
    summary.publish = await publishDuePosts(ctx, connection.connection.ig_user_id, connection.token, {
      onlyPostId,
      maxPosts: onlyPostId ? 1 : 3,
    });

    return jsonResponse(summary);
  } catch (error) {
    console.error('[instagram-scheduler] error', error);
    return errorResponse('Algo no salió bien en la tarea programada de Instagram.', 500);
  }
});
