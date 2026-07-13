import heroBanner from './assets/images/carnival_hero_banner_1783825164543.jpg';
import galaCumbia from './assets/images/gala_cumbia_dress_1783825177019.jpg';
import marimonda from './assets/images/marimonda_costume_1783825190583.jpg';
import atelierMadi from './assets/images/atelier_madi_1783825203627.jpg';

import { Costume, Review } from './types';

export const ASSETS = {
  heroBanner,
  galaCumbia,
  marimonda,
  atelierMadi,
};

export const COSTUMES: Costume[] = [
  {
    id: 'gala-cumbia-real',
    name: 'Gala de Cumbia Real',
    category: 'Tradicional',
    rating: 4.9,
    reviewsCount: 38,
    description: 'Nuestra obra maestra. Una pollera de cumbia de gama alta, elaborada con encajes de bolillo importados, finas arandelas de encaje y adornos dorados hechos a mano. Diseñada para lucir imponente en desfiles, coronaciones y eventos de gala.',
    details: [
      'Costuras reforzadas de alta costura para soportar el baile intenso.',
      'Faldón amplio de 12 metros de ruedo para el perfecto vuelo de cumbia.',
      'Diseño ergonómico con pretina ajustable en la cintura.',
      'Aplicaciones de pedrería fina y lentejuelas cosidas a mano en el corpiño.'
    ],
    fabrics: ['Encaje de Bolillo', 'Raso Satín Real', 'Tul Cristal', 'Gipiur'],
    accessories: [
      'Tocado de flores rojas hechas a mano para el cabello.',
      'Juego de candongas barranquilleras de filigrana dorada.',
      'Manojo de velas decorativas con goteo falso.',
      'Collares dorados de tres hilos tradicionales.'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    primaryImage: galaCumbia,
    gallery: [
      galaCumbia,
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 280000,
    salePrice: 1200000,
    isAvailable: true,
    featured: true,
    designer: 'Sra. Madi (Alta Costura)'
  },
  {
    id: 'marimonda-barrio-abajo',
    name: 'Marimonda de Barrio Abajo',
    category: 'Comparsa',
    rating: 4.8,
    reviewsCount: 45,
    description: 'El disfraz más alegre, irreverente y tradicional del Carnaval de Barranquilla. Diseñado en retazos de colores sumamente llamativos y vibrantes. Incluye la clásica máscara con nariz larga y orejas gigantes que encarnan la burla y el gozo barranquillero.',
    details: [
      'Chaleco y pantalón elaborados en tela satinada de alta resistencia.',
      'Máscara transpirable con forro interior de algodón suave para mayor comodidad.',
      'Acabados con costuras dobles para resistir saltos y piruetas.',
      'Corbata gigante rellena de plumón liviano que mantiene la forma.'
    ],
    fabrics: ['Satín Licrado', 'Seda Lustrillo', 'Algodón Sanforizado (forros)'],
    accessories: [
      'Pito de millo tradicional decorativo.',
      'Guantes blancos de etiqueta carnavalera.',
      'Tirantes elásticos ajustables bicolor.'
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    primaryImage: marimonda,
    gallery: [
      marimonda,
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 140000,
    salePrice: 480000,
    isAvailable: true,
    featured: true,
    designer: 'Atelier Madi'
  },
  {
    id: 'pollera-cumbia-tradicional',
    name: 'Pollera de Cumbia Tradicional',
    category: 'Tradicional',
    rating: 4.7,
    reviewsCount: 24,
    description: 'La pollera clásica a cuadros rojos y blancos que identifica al folclor colombiano. Sencilla pero imponente, confeccionada con tules que le otorgan volumen natural y ligereza. Perfecta para bailadoras y cumbiambas completas.',
    details: [
      'Cuadros de 1.5cm perfectamente alineados en las costuras.',
      'Vuelo completo de 8 metros para un movimiento fluido del faldón.',
      'Blusa de escote amplio de hombro a hombro (palangana) con arandelas.',
      'Cierre ajustable trasero con ojales y cordón tradicional.'
    ],
    fabrics: ['Dacrón Hilo', 'Terlenka Carnavalera', 'Cinta Hilera', 'Tul de Nylon'],
    accessories: [
      'Pañolón rojo para el cuello o cintura.',
      'Flor de cayena roja natural o artificial para la cabeza.',
      'Sandalias de tres puntas de cuero artesanal (abarcas).'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    primaryImage: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 160000,
    salePrice: 550000,
    isAvailable: true,
    featured: false,
    designer: 'Tradición Madi'
  },
  {
    id: 'garabato-elegancia',
    name: 'Garabato Elegancia',
    category: 'Tradicional',
    rating: 4.9,
    reviewsCount: 19,
    description: 'La indumentaria de la Danza del Garabato que escenifica la lucha entre la vida y la muerte. Chaleco negro suntuosamente bordado con hilos de oro y lentejuelas, pantalón bombacho amarillo y capa roja señorial con cintas multicolor.',
    details: [
      'Chaleco con bordado barroco en hilos dorados metálicos.',
      'Capa roja de satín satinado con remates de borlas y cintas colgantes.',
      'Bombacho de satín amarillo brillante con elástico en rodillas.',
      'Camisa blanca de cuello alto de algodón italiano.'
    ],
    fabrics: ['Seda Satín', 'Terciopelo Suave', 'Brocado Imperial'],
    accessories: [
      'Sombrero blanco decorado con flores artificiales, cintas y una gran cinta negra.',
      'Bastón del Garabato tallado en madera pintado con cintas de colores.',
      'Maquillaje artístico blanco y negro tradicional (guía incluida).'
    ],
    sizes: ['M', 'L', 'XL'],
    primaryImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 210000,
    salePrice: 850000,
    isAvailable: true,
    featured: true,
    designer: 'Sra. Madi (Bordados Ancestrales)'
  },
  {
    id: 'guacamaya-carnavalera',
    name: 'Guacamaya de Fantasía',
    category: 'Fantasía',
    rating: 5.0,
    reviewsCount: 15,
    description: 'Un traje espectacular inspirado en la fauna del Caribe colombiano. Confeccionado en una paleta de colores arcoíris con plumas sintéticas de alta calidad dispuestas en degradé, lentejuelas brillantes y apliques de cristales facetados.',
    details: [
      'Estructura de espaldar (alas) ultra ligera y desmontable.',
      'Corpiño ajustable tipo corset con copas prehormadas bordadas.',
      'Falda asimétrica de plumas escalonadas.',
      'Ajustes cómodos con forros de lycra fresca.'
    ],
    fabrics: ['Lycra Metalizada', 'Plumas de Fantasía Recicladas', 'Satín Fluorescente'],
    accessories: [
      'Corona imperial de plumas y pedrería fina.',
      'Brazaletes metalizados decorados.',
      'Gargantilla suntuosa con cristales de imitación.'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    primaryImage: 'https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 350000,
    salePrice: 1600000,
    isAvailable: true,
    featured: true,
    designer: 'Diseño de Fantasía Madi'
  },
  {
    id: 'congo-junior-traditional',
    name: 'Congo Real de Barranquilla',
    category: 'Tradicional',
    rating: 4.8,
    reviewsCount: 22,
    description: 'La danza de negros congos es la más antigua del carnaval. Este atuendo cuenta con el turbante cilíndrico imponente adornado con flores artificiales, mariposas de colores y un largo velo posterior de encaje que llega a los talones.',
    details: [
      'Gorra (turbante) con armazón rígido liviano de cartón y alambre.',
      'Peto bordado con lentejuelas, cuentas y encaje.',
      'Pantalón satinado con parches laterales y cintas colgantes.',
      'Camisa de manga larga de satín de colores brillantes.'
    ],
    fabrics: ['Seda Satín', 'Encaje de Fibras', 'Fieltro y Terciopelo'],
    accessories: [
      'Turbante tradicional decorado con mariposas y flores.',
      'Gafas de sol oscuras retro.',
      'Vejiga inflable de cuero tradicional.',
      'Peto bordado decorativo.'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    primaryImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 190000,
    salePrice: 720000,
    isAvailable: true,
    featured: false,
    designer: 'Artesanos de la Tradición Atlántico'
  },
  {
    id: 'jose-lito-luxury',
    name: 'Jose Lito Carnavalero',
    category: 'Comparsa',
    rating: 4.6,
    reviewsCount: 11,
    description: 'Inspirado en el mítico "Joselito Carnaval", personaje que muere de tanto gozar y resucita al año siguiente. Un frac o esmoquin carnavalero desestructurado con remiendos alegres, sombrero de paja florido y pañuelo fúnebre jocoso.',
    details: [
      'Chaqueta tipo frac cortada con apliques asimétricos de colores.',
      'Pantalón remendado artísticamente con parches de flores y carnaval.',
      'Camisa manga sisa ultra transpirable para el calor caribe.',
      'Tejidos elásticos cómodos para bailar sin restricciones.'
    ],
    fabrics: ['Lino caribeño', 'Satín Raso', 'Algodón Fresco'],
    accessories: [
      'Sombrero de paja "vueltiao" decorado con cintas rojas.',
      'Frasco de "suero medicinal" de carnaval.',
      'Pañuelo grande de lágrimas impreso.'
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    primaryImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 150000,
    salePrice: 500000,
    isAvailable: false,
    featured: false,
    designer: 'Sra. Madi y Atelier'
  },
  {
    id: 'reina-fantasia-esmeralda',
    name: 'Reina de Fantasía Esmeralda',
    category: 'Fantasía',
    rating: 4.9,
    reviewsCount: 31,
    description: 'Un majestuoso e imponente vestido de comparsa o coronación inspirado en las gemas y orfebrería de Colombia. Con un plumaje verde esmeralda y turquesa deslumbrante, miles de canutillos brillantes cosidos a mano y un esplendoroso tocado real.',
    details: [
      'Corset con base de satín reforzado y varillas moldeadoras.',
      'Cientos de plumas sintéticas premium dispuestas simétricamente en el espaldar.',
      'Mallas invisibles color piel de alta durabilidad.',
      'Apliques de cristal que destellan intensamente bajo las luces del desfile.'
    ],
    fabrics: ['Chifón de Seda', 'Malla Elástica Nude', 'Lycra Foil Esmeralda'],
    accessories: [
      'Gran tocado de plumas reales sintéticas de 1 metro de altura.',
      'Hombreras y brazaletes de orfebrería repujada de fantasía.',
      'Collar gargantilla maximalista con incrustaciones verdes.'
    ],
    sizes: ['S', 'M', 'L'],
    primaryImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=800&q=80'
    ],
    rentalPrice: 390000,
    salePrice: 2200000,
    isAvailable: true,
    featured: false,
    designer: 'Sra. Madi (Alta Costura de Coronación)'
  }
];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Camila Torres',
    role: 'Reina de la Comparsa Tambores del Caribe',
    rating: 5,
    comment: 'Alquilé el traje "Gala de Cumbia Real" para la Gran Parada de Tradición y fue un rotundo éxito. La comodidad del corpiño y la amplitud del faldón me permitieron bailar los 4 kilómetros de la Vía 40 sin ninguna molestia. Los encajes son una obra de arte. ¡Sra. Madi es una leyenda!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    date: 'Febrero, 2026'
  },
  {
    id: 'rev-2',
    author: 'Juan Carlos Restrepo',
    role: 'Caporal de la comparsa de Marimondas',
    rating: 5,
    comment: 'Los trajes de Marimonda de Disfraces Madi son los mejores de Barranquilla. Las telas no acaloran, la máscara se mantiene fresca y el diseño es el más alegre de la comparsa. Se nota el amor y la herencia de carnaval en cada costura.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    date: 'Febrero, 2026'
  },
  {
    id: 'rev-3',
    author: 'Isabella Chams',
    role: 'Bailarina e Invitada de Honor de Caimán',
    rating: 5,
    comment: 'Hacerse un traje sobre medidas con la Sra. Madi es una experiencia mágica. Entendió exactamente lo que quería para mi coronación de comparsa de fantasía. El brillo, el movimiento y el encaje esmeralda capturaron todas las miradas. ¡100% recomendado!',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    date: 'Enero, 2026'
  }
];

export const STATS = {
  yearsOfTradition: '35+',
  carnivalsLived: '35',
  costumesRented: '12K+',
  happyHearts: '5K+'
};

export const CONTACT_INFO = {
  address: 'Visitas exclusivas con cita previa',
  city: 'Barranquilla, Atlántico, Colombia',
  phone: '+57 (312) 456-7890',
  whatsapp: '573124567890',
  email: 'contacto@disfracesmadi.com',
  workingHours: [
    { days: 'Lunes a Viernes', hours: '8:00 AM - 7:00 PM' },
    { days: 'Sábados', hours: '9:00 AM - 6:00 PM' },
    { days: 'Domingos (Temporada)', hours: '10:00 AM - 4:00 PM' }
  ]
};
