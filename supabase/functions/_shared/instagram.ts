// Cliente mínimo de la API de Instagram con inicio de sesión unificado (Unified login).
// Login con Facebook Login for Business + config_id; token de usuario del sistema (SUAT) sin vencimiento;
// todas las llamadas en graph.facebook.com. Spec: publicacion_carruseles_instagram.

export const IG_API_VERSION = Deno.env.get('INSTAGRAM_API_VERSION') || 'v25.0';
const GRAPH = `https://graph.facebook.com/${IG_API_VERSION}`;

/** Códigos de Meta que indican que el token ya no sirve (vencido, revocado o sin permiso). */
export const AUTH_ERROR_CODES = [102, 190, 200, 10];

export function isAuthError(error: unknown) {
  return error instanceof InstagramApiError && AUTH_ERROR_CODES.includes(error.code ?? -1);
}

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: number,
    public transient = false
  ) {
    super(message);
  }
}

async function parse(response: Response) {
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok || body?.error) {
    const error = body?.error ?? {};
    const code = typeof error.code === 'number' ? error.code : undefined;
    // 1, 2, 4, 17, 32, 613: errores temporales o de límite de uso según Meta; 5xx también.
    const transient = response.status >= 500 || [1, 2, 4, 17, 32, 613].includes(code ?? -1) || error.is_transient === true;
    throw new InstagramApiError(
      error.error_user_msg || error.message || `Instagram respondió ${response.status}`,
      response.status,
      code,
      transient
    );
  }
  return body;
}

async function graphPost(path: string, params: Record<string, string>, token: string) {
  const response = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return parse(response);
}

async function graphGet(path: string, params: Record<string, string>, token: string) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${GRAPH}/${path}${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parse(response);
}

export async function createCarouselItem(igUserId: string, token: string, imageUrl: string, altText?: string | null) {
  const params: Record<string, string> = { image_url: imageUrl, is_carousel_item: 'true' };
  if (altText) params.alt_text = altText.slice(0, 1000);
  const body = await graphPost(`${igUserId}/media`, params, token);
  return body.id as string;
}

export async function createCarouselContainer(igUserId: string, token: string, children: string[], caption: string) {
  const body = await graphPost(
    `${igUserId}/media`,
    { media_type: 'CAROUSEL', children: children.join(','), caption },
    token
  );
  return body.id as string;
}

/** status_code: EXPIRED | ERROR | FINISHED | IN_PROGRESS | PUBLISHED */
export async function getContainerStatus(containerId: string, token: string) {
  const body = await graphGet(containerId, { fields: 'status_code,status' }, token);
  return { statusCode: body.status_code as string, status: body.status as string | undefined };
}

export async function publishContainer(igUserId: string, token: string, containerId: string) {
  const body = await graphPost(`${igUserId}/media_publish`, { creation_id: containerId }, token);
  return body.id as string;
}

export async function getMediaPermalink(mediaId: string, token: string) {
  try {
    const body = await graphGet(mediaId, { fields: 'permalink' }, token);
    return (body.permalink as string) ?? null;
  } catch {
    return null;
  }
}

export async function getPublishingQuota(igUserId: string, token: string) {
  const body = await graphGet(`${igUserId}/content_publishing_limit`, { fields: 'quota_usage,config' }, token);
  const entry = body?.data?.[0] ?? {};
  return { used: Number(entry.quota_usage ?? 0), total: Number(entry.config?.quota_total ?? 100) };
}

function metaApp() {
  const appId = Deno.env.get('META_APP_ID');
  const appSecret = Deno.env.get('META_APP_SECRET');
  const configId = Deno.env.get('META_LOGIN_CONFIG_ID');
  if (!appId || !appSecret || !configId) {
    throw new Error('Faltan META_APP_ID, META_APP_SECRET o META_LOGIN_CONFIG_ID');
  }
  return { appId, appSecret, configId };
}

export function isMetaAppConfigured() {
  return Boolean(Deno.env.get('META_APP_ID') && Deno.env.get('META_APP_SECRET') && Deno.env.get('META_LOGIN_CONFIG_ID'));
}

/** Cambia el código del inicio de sesión unificado por el token de usuario del sistema (no vence). */
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const { appId, appSecret } = metaApp();
  const response = await fetch(
    `${GRAPH}/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    })}`
  );
  const body = await parse(response);
  if (!body?.access_token) throw new InstagramApiError('Meta no devolvió un token de acceso', 400);
  const expiresIn = Number(body.expires_in ?? 0);
  return { accessToken: body.access_token as string, expiresIn: expiresIn > 0 ? expiresIn : null };
}

export interface InstagramAccount {
  id: string;
  username: string | null;
  name: string | null;
}

/**
 * Cuentas de Instagram asignadas al token. Con el token de usuario del sistema, `/me` es el usuario del sistema,
 * no la cuenta: las cuentas se listan en `/me/assigned_instagram_accounts`.
 */
export async function listAssignedInstagramAccounts(token: string): Promise<InstagramAccount[]> {
  const body = await graphGet('me/assigned_instagram_accounts', { fields: 'id,username,name', limit: '25' }, token);
  const rows: any[] = Array.isArray(body?.data) ? body.data : [];
  const accounts: InstagramAccount[] = [];
  for (const row of rows) {
    if (!row?.id) continue;
    let username: string | null = row.username ?? null;
    let name: string | null = row.name ?? null;
    if (!username) {
      // Algunos nodos del borde no traen los campos: se piden a la cuenta directamente.
      const detail = await getInstagramAccount(String(row.id), token).catch(() => null);
      username = detail?.username ?? null;
      name = name ?? detail?.name ?? null;
    }
    accounts.push({ id: String(row.id), username, name });
  }
  return accounts;
}

export async function getInstagramAccount(igUserId: string, token: string): Promise<InstagramAccount> {
  const body = await graphGet(igUserId, { fields: 'id,username,name' }, token);
  return { id: String(body.id ?? igUserId), username: body.username ?? null, name: body.name ?? null };
}

// --- state firmado para el flujo OAuth --------------------------------------------------------

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(value: string) {
  const secret = Deno.env.get('META_APP_SECRET');
  if (!secret) throw new Error('Falta META_APP_SECRET');
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

/** state = userId.expiración.firma — válido 15 minutos. */
export async function signState(userId: string) {
  const payload = `${userId}.${Date.now() + 15 * 60 * 1000}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyState(state: string): Promise<string | null> {
  const parts = state.split('.');
  if (parts.length !== 3) return null;
  const [userId, expires, signature] = parts;
  if (Number(expires) < Date.now()) return null;
  const expected = await hmac(`${userId}.${expires}`);
  return expected === signature ? userId : null;
}

export function oauthRedirectUri() {
  const url = Deno.env.get('SUPABASE_URL');
  return `${url}/functions/v1/instagram-oauth-callback`;
}

/** Diálogo del inicio de sesión unificado (mismos parámetros que la URL que genera el panel de Meta). */
export function authorizeUrl(state: string) {
  const { appId, configId } = metaApp();
  return `https://www.facebook.com/dialog/oauth?${new URLSearchParams({
    client_id: appId,
    config_id: configId,
    override_default_response_type: 'true',
    redirect_uri: oauthRedirectUri(),
    response_type: 'code',
    state,
    prompt: 'login',
  })}`;
}
