import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { errorResponse } from './http.ts';

export type AiUsageKind = 'photo_edit' | 'data_extract' | 'caption';

export interface AdminContext {
  userId: string;
  /** Cliente con la sesión del admin: respeta RLS. */
  userClient: SupabaseClient;
  /** Cliente con service role: solo para el registro de uso. */
  serviceClient: SupabaseClient;
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

/** Valida que la petición venga de un usuario autenticado con rol admin (`public.is_admin()`). */
export async function requireAdmin(req: Request): Promise<AdminContext | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return errorResponse('Tu sesión expiró. Vuelve a iniciar sesión en el panel.', 401);
  }

  const url = requireEnv('SUPABASE_URL');
  const userClient = createClient(url, requireEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return errorResponse('Tu sesión expiró. Vuelve a iniciar sesión en el panel.', 401);
  }

  const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin');
  if (adminError || isAdmin !== true) {
    return errorResponse('Esta función es solo para administradores del panel.', 403);
  }

  const serviceClient = createClient(url, requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  return { userId: userData.user.id, userClient, serviceClient };
}

/** Devuelve una respuesta 429 si el admin superó el límite por hora; null si puede continuar. */
export async function enforceHourlyLimit(
  ctx: AdminContext,
  kind: AiUsageKind,
  maxPerHour: number
): Promise<Response | null> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await ctx.serviceClient
    .from('ai_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.userId)
    .eq('kind', kind)
    .gte('created_at', since);

  if (error) {
    console.error('[ai_usage_log] no se pudo consultar el uso', error);
    return errorResponse('Algo no salió bien. Intenta de nuevo en un momento.', 500);
  }

  if ((count ?? 0) >= maxPerHour) {
    return errorResponse(
      `Llegaste al límite de ${maxPerHour} por hora para cuidar los costos. Intenta de nuevo más tarde.`,
      429
    );
  }
  return null;
}

export async function logUsage(ctx: AdminContext, kind: AiUsageKind, model: string) {
  const { error } = await ctx.serviceClient
    .from('ai_usage_log')
    .insert({ user_id: ctx.userId, kind, model });
  if (error) {
    console.error('[ai_usage_log] no se pudo registrar el uso', error);
  }
}

/** Identificador anónimo y estable del admin para OpenAI (`safety_identifier`), sin exponer su id. */
export async function safetyIdentifier(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`madi:${userId}`));
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
