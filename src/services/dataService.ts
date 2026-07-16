import { supabase, isSupabaseConfigured, getPublicImageUrl } from '../lib/supabase';
import { Costume, CostumeCategory, Review, SiteStats } from '../types';
import { ASSETS, CONTACT_INFO, COSTUMES, REVIEWS, STATS } from '../data';

function normalizeCostumeRecord(costume: any): Costume {
  const primaryImage = costume.primaryImage ?? costume.primary_image ?? '';
  const gallery = costume.gallery ?? costume.gallery_urls ?? costume.gallery_path ?? [];

  return {
    ...costume,
    primaryImage: getPublicImageUrl(primaryImage),
    gallery: Array.isArray(gallery)
      ? gallery.map((item) => getPublicImageUrl(item))
      : [],
    sizes: costume.sizes ?? [],
    details: costume.details ?? [],
    fabrics: costume.fabrics ?? [],
    accessories: costume.accessories ?? [],
  } as Costume;
}

function normalizeSiteStatsRecord(stats: unknown): SiteStats {
  const source = (stats ?? {}) as Record<string, unknown>;

  return {
    yearsOfTradition: String(
      source.yearsOfTradition ?? source.years_of_tradition ?? STATS.yearsOfTradition
    ),
    carnivalsLived: String(
      source.carnivalsLived ?? source.carnivals_lived ?? STATS.carnivalsLived
    ),
    costumesRented: String(
      source.costumesRented ?? source.costumes_rented ?? STATS.costumesRented
    ),
    happyHearts: String(
      source.happyHearts ?? source.happy_hearts ?? STATS.happyHearts
    ),
  };
}

export async function fetchCostumesFull(category?: CostumeCategory): Promise<Costume[]> {
  if (!isSupabaseConfigured) {
    return category
      ? COSTUMES.filter((costume) => costume.category === category)
      : [...COSTUMES];
  }

  let query = supabase.from('costumes_full').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Supabase] fetchCostumesFull error', error);
    return category
      ? COSTUMES.filter((costume) => costume.category === category)
      : [...COSTUMES];
  }

  if (!Array.isArray(data)) {
    return category
      ? COSTUMES.filter((costume) => costume.category === category)
      : [...COSTUMES];
  }

  return data.map(normalizeCostumeRecord);
}

export async function fetchSiteStats(): Promise<SiteStats> {
  if (!isSupabaseConfigured) {
    return { ...STATS };
  }

  const { data, error } = await supabase.from('site_stats').select('*').single();
  if (error) {
    console.error('[Supabase] fetchSiteStats error', error);
    return { ...STATS };
  }

  return normalizeSiteStatsRecord(data);
}

export async function fetchContactInfo() {
  if (!isSupabaseConfigured) {
    return { ...CONTACT_INFO };
  }

  const [contactInfoResult, workingHoursResult] = await Promise.all([
    supabase.from('contact_info').select('*').single(),
    supabase.from('working_hours').select('*').order('sort_order', { ascending: true }),
  ]);

  const { data, error } = contactInfoResult;
  const { data: workingHoursData, error: workingHoursError } = workingHoursResult;

  if (error) {
    console.error('[Supabase] fetchContactInfo error', error);
    return { ...CONTACT_INFO };
  }

  if (workingHoursError) {
    console.error('[Supabase] fetchWorkingHours error', workingHoursError);
  }

  return {
    ...CONTACT_INFO,
    ...(data ?? {}),
    workingHours: Array.isArray(workingHoursData) && workingHoursData.length > 0
      ? workingHoursData
      : CONTACT_INFO.workingHours,
  };
}

export async function fetchReviews(): Promise<Review[]> {
  if (!isSupabaseConfigured) {
    return [...REVIEWS];
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] fetchReviews error', error);
    return [...REVIEWS];
  }

  return Array.isArray(data) ? (data as Review[]) : [...REVIEWS];
}

export function fetchAssetUrl(storagePath: string, bucket = 'site-assets') {
  return getPublicImageUrl(storagePath, bucket);
}
