import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface SchedulerContext {
  db: SupabaseClient;
  now: Date;
  supabaseUrl: string;
}

export function createSchedulerContext(): SchedulerContext {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  return { db, now: new Date(), supabaseUrl };
}

export function publicUrl(ctx: SchedulerContext, bucket: string, path: string) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${ctx.supabaseUrl}/storage/v1/object/public/${bucket}/${encoded}`;
}

export async function log(ctx: SchedulerContext, postId: string | null, level: 'info' | 'error', message: string) {
  await ctx.db.from('instagram_publish_log').insert({ post_id: postId, level, message: message.slice(0, 2000) });
}

export async function getConnection(ctx: SchedulerContext) {
  const [{ data: connection }, { data: token }] = await Promise.all([
    ctx.db.from('instagram_connection').select('*').eq('id', true).maybeSingle(),
    ctx.db.from('instagram_tokens').select('access_token').eq('id', true).maybeSingle(),
  ]);
  if (!connection || !token?.access_token) return null;
  return { connection, token: token.access_token as string };
}
