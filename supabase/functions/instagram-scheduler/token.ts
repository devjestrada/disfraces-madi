import { getInstagramAccount, isAuthError } from '../_shared/instagram.ts';
import type { SchedulerContext } from './context.ts';

/** Cada cuánto se comprueba que el token sigue sirviendo (el de usuario del sistema no vence, pero se puede revocar). */
const CHECK_EVERY_MS = 60 * 60 * 1000;

export const BROKEN_CONNECTION_MESSAGE =
  'El acceso a Instagram dejó de funcionar (se revocó o cambió en Meta). Vuelve a conectar la cuenta.';

export async function markConnectionBroken(ctx: SchedulerContext, detail: string) {
  const nowIso = ctx.now.toISOString();
  await ctx.db
    .from('instagram_connection')
    .update({ last_error: `${BROKEN_CONNECTION_MESSAGE} (${detail.slice(0, 300)})`, last_checked_at: nowIso, updated_at: nowIso })
    .eq('id', true);
}

/**
 * Comprueba el acceso a la cuenta. Devuelve false si el token ya no sirve: en ese caso no se intenta publicar
 * hasta que un admin vuelva a conectar. Los errores temporales no cuentan como conexión rota.
 */
export async function checkConnection(ctx: SchedulerContext, connection: any, token: string) {
  const brokenBefore = Boolean(connection.last_error);
  const lastCheck = connection.last_checked_at ? new Date(connection.last_checked_at).getTime() : 0;
  if (!brokenBefore && ctx.now.getTime() - lastCheck < CHECK_EVERY_MS) return true;

  try {
    const account = await getInstagramAccount(connection.ig_user_id, token);
    const nowIso = ctx.now.toISOString();
    await ctx.db
      .from('instagram_connection')
      .update({
        username: account.username ?? connection.username,
        last_checked_at: nowIso,
        last_error: null,
        updated_at: nowIso,
      })
      .eq('id', true);
    return true;
  } catch (error) {
    if (isAuthError(error)) {
      await markConnectionBroken(ctx, error instanceof Error ? error.message : String(error));
      return false;
    }
    console.warn('[instagram-scheduler] no se pudo comprobar la conexión (temporal)', error);
    return !brokenBefore;
  }
}
