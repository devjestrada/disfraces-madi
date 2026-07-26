export const SITE_URL = 'https://disfracesmadi.com';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const DEFAULT_OG_IMAGE = absoluteUrl('/og-image.jpg');
