import sra_madi_nuestra_historia from './assets/init_page/images/sra_madi_nuestra_historia.webp';

// Servido desde public/ (ruta estática, sin hash) en vez de importado como
// módulo JS: así el preload scanner del navegador puede descubrirlo desde el
// <link rel="preload"> de index.html sin esperar a que se ejecute el bundle.
// Ver docs/specs/specs_backlog/optimizacion_hero_imagen_inicio.spec.md sección 1.
const carnival_main_banner = '/hero-carnaval.webp';

import categoria_cumbia from './assets/init_page/images/categorias_destacadas/cumbia.jpg';
import categoria_mapale from './assets/init_page/images/categorias_destacadas/mapale.jpg';
import categoria_garabato from './assets/init_page/images/categorias_destacadas/garabato.jpg';
import categoria_fantasia from './assets/init_page/images/categorias_destacadas/fantasia.jpg';

export const ASSETS = {
  carnival_main_banner,
  sra_madi_nuestra_historia,
  atelierMadi: sra_madi_nuestra_historia,
  categoria_cumbia,
  categoria_mapale,
  categoria_garabato,
  categoria_fantasia
};

export const STATS = {
  yearsOfTradition: '25+',
  carnivalsLived: '25',
  costumesRented: '12K+',
  happyHearts: '5K+'
};

export const CONTACT_INFO = {
  address: 'Visitas exclusivas con cita previa',
  city: 'Barranquilla, Atlántico, Colombia',
  phone: '+57 (301) 726-3172',
  whatsapp: '573017263172',
  email: 'contacto@disfracesmadi.com',
  workingHours: [
    { days: 'Lunes a Viernes', hours: '8:00 AM - 7:00 PM' },
    { days: 'Sábados', hours: '9:00 AM - 6:00 PM' },
    { days: 'Domingos (Temporada)', hours: '10:00 AM - 4:00 PM' }
  ]
};
