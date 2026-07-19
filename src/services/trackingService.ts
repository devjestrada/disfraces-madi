import { supabase, isSupabaseConfigured } from '../lib/supabase';

const SESSION_ID_KEY = 'madi_session_id';
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

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

async function insertEvent(costumeId: string, eventType: 'view' | 'whatsapp_click') {
  if (!isSupabaseConfigured) {
    return;
  }

  try {
    const { error } = await supabase.from('costume_events').insert({
      costume_id: costumeId,
      event_type: eventType,
      session_id: getOrCreateSessionId(),
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

/** Fire-and-forget: never blocks the WhatsApp CTA from opening. */
export function trackWhatsAppClick(costumeId: string) {
  void insertEvent(costumeId, 'whatsapp_click');
}
