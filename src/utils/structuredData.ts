import { Costume, ContactInfo } from '../types';
import { absoluteUrl } from './seo';

export function buildLocalBusinessLd(contactInfo: ContactInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'Disfraces Madi',
    description:
      'Alquiler y venta de disfraces artesanales del Carnaval de Barranquilla. Visitas exclusivas con cita previa.',
    url: absoluteUrl('/'),
    telephone: contactInfo.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Barranquilla',
      addressRegion: 'Atlántico',
      addressCountry: 'CO',
    },
  };
}

export function buildProductLd(costume: Costume, path: string) {
  const offers: object[] = [];

  if (costume.rentalPrice) {
    offers.push({
      '@type': 'Offer',
      price: costume.rentalPrice,
      priceCurrency: 'COP',
      businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      availability: costume.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    });
  }

  if (costume.salePrice) {
    offers.push({
      '@type': 'Offer',
      price: costume.salePrice,
      priceCurrency: 'COP',
      businessFunction: 'http://purl.org/goodrelations/v1#Sell',
      availability: costume.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: costume.name,
    description: costume.description,
    image: costume.primaryImage,
    url: absoluteUrl(path),
    ...(offers.length > 0 ? { offers } : {}),
  };
}

export function buildBreadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
