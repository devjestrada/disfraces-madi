import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

export function getPublicImageUrl(storagePath: string, bucket = 'costume-images') {
  if (!storagePath || !isSupabaseConfigured) {
    return storagePath;
  }

  if (/^(https?:\/\/|\/)/.test(storagePath)) {
    return storagePath;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data?.publicUrl ?? storagePath;
}
