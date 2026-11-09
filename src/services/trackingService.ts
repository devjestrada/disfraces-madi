import { supabase, isSupabaseConfigured } from '../lib/supabase';

const SESSION_ID_KEY = 'madi_session_id';
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;
const CLICK_DEDUP_WINDOW_MS = 10 * 1000;

/** Origen de un clic a WhatsApp. Debe coincidir con el check de la migración 013. */
export type WhatsAppClickSource =
  | 'floating_button'
  | 'costume_detail'
  | 'catalog'
  | 'home_hero'
  | 'home_footer_cta'
  | 'services_card'
  | 'services_cta'
  | 'contact'
  | 'contact_direct'
  | 'footer';

/** No se registran eventos desde entornos locales para no contaminar las métricas de producción. */
function isLocalEnvironment(): boolean {
  try {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.local');
  } catch {
    return false;
  }
}

function getOrCreateSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_ID_KEY);
    if (existing) {
      return existing;
    }
    const created = crypto.randomUUID();
    window.localStorage.setItem(SESSION_ID_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

async function insertEvent(
  costumeId: string | null,
  eventType: 'view' | 'whatsapp_click',
  source: WhatsAppClickSource | null = null
) {
  if (!isSupabaseConfigured || isLocalEnvironment()) {
    return;
  }

  try {
    const { error } = await supabase.from('costume_events').insert({
      costume_id: costumeId,
      event_type: eventType,
      session_id: getOrCreateSessionId(),
      source,
    });
    if (error) {
      console.error('[tracking] failed to record event', error);
    }
  } catch (error) {
    console.error('[tracking] failed to record event', error);
  }
}

/** Fire-and-forget: never blocks navigation, deduped per costume within a 30 min window. */
export function trackCostumeView(costumeId: string) {
  const dedupKey = `madi_view_${costumeId}`;

  try {
    const lastSeen = window.localStorage.getItem(dedupKey);
    if (lastSeen && Date.now() - Number(lastSeen) < VIEW_DEDUP_WINDOW_MS) {
      return;
    }
    window.localStorage.setItem(dedupKey, String(Date.now()));
  } catch {
    // localStorage unavailable (private browsing, etc.) - track anyway, no dedup possible.
  }

  void insertEvent(costumeId, 'view');
}

const lastClickAt = new Map<string, number>();

/**
 * Fire-and-forget: nunca bloquea la apertura de WhatsApp.
 * Ignora un clic repetido del mismo origen y disfraz dentro de 10 s (doble clic accidental).
 */
export function trackWhatsAppClick({
  source,
  costumeId,
}: {
  source: WhatsAppClickSource;
  costumeId?: string | null;
}) {
  const key = `${source}:${costumeId ?? ''}`;
  const now = Date.now();
  const previous = lastClickAt.get(key);
  if (previous !== undefined && now - previous < CLICK_DEDUP_WINDOW_MS) {
    return;
  }
  lastClickAt.set(key, now);

  void insertEvent(costumeId ?? null, 'whatsapp_click', source);
}
