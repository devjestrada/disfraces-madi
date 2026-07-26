import { useEffect } from 'react';
import { absoluteUrl, DEFAULT_OG_IMAGE } from '../utils/seo';

interface DocumentMetaOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
}

function upsertMetaByAttr(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentMeta({ title, description, path, ogImage, ogType = 'website' }: DocumentMetaOptions) {
  useEffect(() => {
    const url = absoluteUrl(path);
    const image = ogImage ?? DEFAULT_OG_IMAGE;

    document.title = title;
    upsertMetaByAttr('name', 'description', description);
    upsertMetaByAttr('property', 'og:title', title);
    upsertMetaByAttr('property', 'og:description', description);
    upsertMetaByAttr('property', 'og:type', ogType);
    upsertMetaByAttr('property', 'og:url', url);
    upsertMetaByAttr('property', 'og:image', image);
    upsertMetaByAttr('property', 'og:locale', 'es_CO');
    upsertMetaByAttr('name', 'twitter:card', 'summary_large_image');
    upsertMetaByAttr('name', 'twitter:title', title);
    upsertMetaByAttr('name', 'twitter:description', description);
    upsertMetaByAttr('name', 'twitter:image', image);
    upsertCanonicalLink(url);
  }, [title, description, path, ogImage, ogType]);
}

export function useStructuredData(id: string, data: object | null) {
  useEffect(() => {
    const existing = document.getElementById(id);

    if (!data) {
      existing?.remove();
      return;
    }

    let script = existing as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => {
      document.getElementById(id)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, JSON.stringify(data)]);
}
