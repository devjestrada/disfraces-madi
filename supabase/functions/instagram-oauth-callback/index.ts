// Retorno del inicio de sesión unificado de Meta. Es pública (se despliega con --no-verify-jwt) porque la
// llama Meta con una redirección; la autorización se valida con el `state` firmado.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  exchangeCodeForToken,
  listAssignedInstagramAccounts,
  oauthRedirectUri,
  verifyState,
} from '../_shared/instagram.ts';

function backToPanel(result: 'conectado' | 'error', detail?: string) {
  const site = (Deno.env.get('SITE_URL') || '').replace(/\/$/, '');
  const params = new URLSearchParams({ instagram: result });
  if (detail) params.set('detalle', detail);
  return new Response(null, { status: 302, headers: { Location: `${site}/admin?${params}` } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const error = url.searchParams.get('error');
  const code = (url.searchParams.get('code') || '').replace(/#_$/, '');
  const state = url.searchParams.get('state') || '';

  if (error) {
    return backToPanel('error', 'cancelado');
  }
  if (!code || !state) {
    return backToPanel('error', 'respuesta_incompleta');
  }

  try {
    const userId = await verifyState(state);
    if (!userId) {
      return backToPanel('error', 'enlace_vencido');
    }

    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });
    const { data: admin } = await service.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
    if (!admin) {
      return backToPanel('error', 'sin_permiso');
    }

    const { accessToken, expiresIn } = await exchangeCodeForToken(code, oauthRedirectUri());

    // El token debe llegar a la cuenta de Instagram; si no hay cuentas asignadas, no se da por conectada.
    const accounts = await listAssignedInstagramAccounts(accessToken);
    if (!accounts.length) {
      console.warn('[instagram-oauth-callback] el token no tiene cuentas de Instagram asignadas');
      return backToPanel('error', 'sin_cuenta');
    }
    if (accounts.length > 1) {
      console.warn(`[instagram-oauth-callback] ${accounts.length} cuentas asignadas; se usa la primera`);
    }
    const account = accounts[0];

    const now = new Date();
    const nowIso = now.toISOString();
    const { error: tokenError } = await service
      .from('instagram_tokens')
      .upsert({ id: true, access_token: accessToken, updated_at: nowIso });
    if (tokenError) throw tokenError;

    const { error: connectionError } = await service.from('instagram_connection').upsert({
      id: true,
      ig_user_id: account.id,
      username: account.username,
      account_name: account.name,
      connected_at: nowIso,
      token_expires_at: expiresIn ? new Date(now.getTime() + expiresIn * 1000).toISOString() : null,
      last_checked_at: nowIso,
      last_error: null,
      updated_at: nowIso,
    });
    if (connectionError) throw connectionError;

    return backToPanel('conectado');
  } catch (callbackError) {
    console.error('[instagram-oauth-callback] error', callbackError);
    return backToPanel('error', 'intercambio_fallido');
  }
});
