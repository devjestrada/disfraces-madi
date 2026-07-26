import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '../src/utils/seo';

const STATIC_ROUTES = ['/', '/catalogo', '/servicios', '/nuestra-historia', '/contacto'];

async function fetchCostumeSlugs(): Promise<string[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[sitemap] Supabase no configurado, generando sitemap solo con rutas estáticas.');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.from('costumes_full').select('slug').eq('is_available', true);

  if (error) {
    console.error('[sitemap] Error consultando costumes_full:', error.message);
    return [];
  }

  return (data ?? []).map((row) => row.slug as string);
}

function buildUrlEntry(path: string, lastmod: string): string {
  return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
}

async function main() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const slugs = await fetchCostumeSlugs();

  const urls = [
    ...STATIC_ROUTES.map((path) => buildUrlEntry(path, lastmod)),
    ...slugs.map((slug) => buildUrlEntry(`/catalogo/${slug}`, lastmod)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  writeFileSync(resolve('public/sitemap.xml'), xml, 'utf-8');
  console.log(`[sitemap] Generado public/sitemap.xml con ${urls.length} URLs.`);
}

main();
