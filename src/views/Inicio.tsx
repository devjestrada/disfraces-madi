import React from 'react';
import { Sparkles, ArrowRight, Star, Calendar, Compass, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { ASSETS } from '../data';
import { usePublicData } from '../context/PublicDataContext';
import WhatsAppIcon from '../components/WhatsAppIcon';
import type { CostumeCategory } from '../types';

interface InicioProps {
  onNavigate: (view: string, costumeId?: string, category?: CostumeCategory | 'Todos') => void;
}

export default function Inicio({ onNavigate }: InicioProps) {
  const categories: Array<{
    id: CostumeCategory;
    name: string;
    desc: string;
    img: string;
    badge: string;
  }> = [
    {
      id: 'Cumbia',
      name: 'Cumbia',
      desc: 'Polleras majestuosas y ritmo eterno para bailar con orgullo.',
      img: ASSETS.categoria_cumbia,
      badge: 'Cumbia'
    },
    {
      id: 'Fantasía',
      name: 'Fantasía',
      desc: 'Trajes de ensueño que brillan en cada desfile y coronación.',
      img: ASSETS.categoria_fantasia,
      badge: 'Fantasía'
    },
    {
      id: 'Mapalé',
      name: 'Mapalé',
      desc: 'Fuerza ancestral y movimiento intenso con cada pisada.',
      img: ASSETS.categoria_mapale,
      badge: 'Mapalé'
    },
    {
      id: 'Garabato',
      name: 'Garabato',
      desc: 'Elegancia ancestral que encarna la danza del duelo y su espíritu.',
      img: ASSETS.categoria_garabato,
      badge: 'Garabato'
    }
  ];

  const { contactInfo, siteStats, reviews } = usePublicData();

  return (
    <div className="bg-[#fff8f5]" id="inicio-view-root">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" id="hero-section">
        {/* Ambient background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={ASSETS.carnival_main_banner}
            alt="Carnaval de Barranquilla"
            className="w-full h-full object-cover scale-105 filter brightness-45 contrast-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b18] via-transparent to-[#1e1b18]/45"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-[#fff8f5] space-y-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-[#fdc003]/20 border border-[#fdc003]/40 px-4 py-1.5 rounded-full backdrop-blur-md"
          >
            <Sparkles className="h-4.5 w-4.5 text-[#fdc003]" />
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#fdc003]">
              Boutique Exclusiva de Carnaval
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight"
          >
            Vive la Magia del Carnaval con <span className="text-[#fdc003] block sm:inline">Disfraces Madi</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base sm:text-xl text-[#fff8f5]/85 max-w-2xl mx-auto font-sans leading-relaxed"
          >
            Alquiler presencial de alta costura, diseño sobre medidas y venta de atuendos tradicionales con el sello artesanal de Barranquilla.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={() => onNavigate('catalogo', undefined, 'Todos')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-[#a8001a] hover:bg-[#920014] text-[#fff8f5] font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <Compass className="h-5 w-5 text-[#fdc003]" />
              <span>Explorar Colección</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
            <a
              href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, me gustaría solicitar disponibilidad para agendar una cita de fitting presencial en la boutique.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-4 bg-[#25d366] hover:bg-[#20ba5a] text-white font-semibold rounded-full shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              <WhatsAppIcon className="h-5 w-5 text-white" />
              <span>Agendar mi Cita</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Stats Section (Bento design) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-20" id="stats-section">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-[#a8001a]/10 grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 lg:divide-x divide-[#a8001a]/10">
          <div className="text-center p-4">
            <p className="font-serif text-4xl md:text-5xl font-bold text-[#a8001a]">{siteStats.yearsOfTradition}</p>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#1e1b18]/60 mt-2 font-mono">Años de Tradición</p>
          </div>
          <div className="text-center p-4">
            <p className="font-serif text-4xl md:text-5xl font-bold text-[#a8001a]">{siteStats.carnivalsLived}</p>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#1e1b18]/60 mt-2 font-mono">Carnavales Vividos</p>
          </div>
          <div className="text-center p-4">
            <p className="font-serif text-4xl md:text-5xl font-bold text-[#a8001a]">{siteStats.costumesRented}</p>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#1e1b18]/60 mt-2 font-mono">Vestidos Alquilados</p>
          </div>
          <div className="text-center p-4">
            <p className="font-serif text-4xl md:text-5xl font-bold text-[#a8001a]">{siteStats.happyHearts}</p>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#1e1b18]/60 mt-2 font-mono">Corazones Felices</p>
          </div>
        </div>
      </section>

      {/* 3. Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="categories-section">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono">
            ★ Diversidad Folclórica ★
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#1e1b18]">
            Categorías Destacadas
          </h2>
          <p className="text-sm sm:text-base text-[#1e1b18]/70 font-sans">
            Cada danza del Carnaval de Barranquilla cuenta una historia diferente. Escoge la categoría de disfraz en la que deseas lucir imponente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="categories-grid">
          {categories.map((category, idx) => (
            <div
              key={category.id}
              onClick={() => onNavigate('catalogo', undefined, category.id)}
              className="group relative h-96 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
              id={`category-card-${category.id}`}
            >
              <img
                src={category.img}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 brightness-75 group-hover:brightness-60"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b18]/90 via-[#1e1b18]/20 to-transparent"></div>
              
              <span className="absolute top-4 left-4 bg-[#a8001a] text-white text-[10px] uppercase tracking-widest font-mono font-bold px-3 py-1 rounded-full shadow">
                {category.badge}
              </span>

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <h3 className="font-serif text-xl font-bold group-hover:text-[#fdc003] transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-white/85 leading-relaxed font-sans">
                  {category.desc}
                </p>
                <div className="flex items-center space-x-1 text-[#fdc003] text-xs font-semibold pt-1">
                  <span>Ver disfraces</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Atelier Spotlight - El Corazón de Madi */}
      <section className="bg-[#1e1b18] text-[#fff8f5] py-24 my-16 overflow-hidden" id="atelier-spotlight-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Image Column */}
            <div className="lg:col-span-5 relative" id="atelier-image-container">
              <div className="absolute -top-6 -left-6 w-32 h-32 border-t-4 border-l-4 border-[#fdc003] rounded-tl-3xl opacity-50 z-0"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 border-b-4 border-r-4 border-[#a8001a] rounded-br-3xl opacity-50 z-0"></div>
              <img
                src={ASSETS.sra_madi_nuestra_historia}
                alt="Atelier de Costura de Madi"
                className="w-full rounded-2xl shadow-2xl relative z-10 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-4 left-6 bg-[#fdc003] text-[#1e1b18] px-6 py-3 rounded-xl shadow-lg z-20 font-serif font-bold text-sm flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>25+ Años de Tradición Carnavalera</span>
              </div>
            </div>

            {/* Narrative Column */}
            <div className="lg:col-span-7 space-y-6" id="atelier-narrative">
              <span className="text-[#fdc003] text-xs font-bold uppercase tracking-widest font-mono">
                ✦ HISTORIA VIVA ✦
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                El Corazón de Madi: Diseños que honran al Patrimonio
              </h2>
              <p className="text-base sm:text-lg text-[#fff8f5]/80 leading-relaxed font-sans">
                Detrás de cada majestuoso vestido y cada alegre pollera de nuestra tienda, se encuentra la maestría y herencia de la Sra. Madi. Junto a su equipo de artesanas costeñas, selecciona telas exclusivas, encajes finos y diseña a medida las ilusiones de bailarinas, reinas de comparsa y amantes del Carnaval.
              </p>
              <p className="text-sm text-[#fff8f5]/70 leading-relaxed font-sans">
                Para nosotros, un disfraz no es solo una prenda temporal; es un estandarte de identidad barranquillera, un tributo a las danzas africanas, indígenas y españolas que convergen en la fiesta más grande de Colombia.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate('historia')}
                  className="px-6 py-3.5 bg-[#fdc003] hover:bg-[#fabd00] text-[#1e1b18] font-bold text-sm rounded-full tracking-wider uppercase transition-colors shadow-lg cursor-pointer"
                >
                  Conocer Nuestra Historia
                </button>
                <button
                  onClick={() => onNavigate('servicios')}
                  className="px-6 py-3.5 bg-transparent hover:bg-white/5 border border-white/20 text-white font-bold text-sm rounded-full tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Ver Diseño a Medida
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Our Queens (Reviews / Testimonials) */}
      {false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="testimonials-section">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono">
              ★ TESTIMONIOS ★
            </span>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#1e1b18]">
              El Brillo de Nuestras Reinas y Reyes
            </h2>
            <p className="text-sm sm:text-base text-[#1e1b18]/70 font-sans">
              La mejor prueba de nuestra pasión es el regocijo de quienes visten nuestros diseños en cada evento de Carnaval, desde el Palco hasta el Bordillo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="testimonials-grid">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white p-8 rounded-3xl border border-[#a8001a]/10 hover:border-[#a8001a]/30 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                id={`testimonial-card-${review.id}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-1 text-[#fdc003]">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4.5 w-4.5 fill-[#fdc003] text-[#fdc003]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#1e1b18]/85 italic leading-relaxed font-sans">
                    "{review.comment}"
                  </p>
                </div>
                
                <div className="flex items-center space-x-4 pt-6 border-t border-[#a8001a]/10 mt-6">
                  <img
                    src={review.avatar}
                    alt={review.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#a8001a]/20"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#1e1b18]">{review.author}</h4>
                    <p className="text-[11px] font-mono font-bold text-[#a8001a] uppercase">{review.role}</p>
                    <p className="text-[10px] text-[#1e1b18]/50 mt-0.5">{review.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Guarantee Banner */}
      <section className="bg-gradient-to-br from-[#fff8f5] to-[#fce3da] border-y border-[#a8001a]/10 py-16" id="guarantee-section">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <ShieldCheck className="h-12 w-12 text-[#a8001a] mx-auto" />
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#1e1b18]">
            Tu Tranquilidad es Nuestra Prioridad
          </h3>
          <p className="text-sm sm:text-base text-[#1e1b18]/75 max-w-2xl mx-auto font-sans leading-relaxed">
            Cada traje alquilado pasa por un estricto proceso de lavado y retoque profesional.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('servicios')}
              className="text-xs tracking-wider uppercase font-bold text-[#a8001a] hover:text-[#920014] flex items-center justify-center space-x-1 mx-auto cursor-pointer"
            >
              <span>Conoce todos nuestros servicios</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Final Call-to-Action Banner */}
      <section className="bg-[#a8001a] text-white py-16 relative overflow-hidden" id="cta-footer-section">
        <div className="absolute right-0 top-0 opacity-10">
          <Sparkles className="h-96 w-96 text-[#fdc003]" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
            ¿Listo para brillar en tu evento de Carnaval?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto font-sans">
            Visítanos en nuestra boutique presencial, agenda tu cita de fitting o escríbenos directamente para cotizar tu diseño artesanal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, me gustaría solicitar disponibilidad para agendar una cita de fitting presencial en la boutique.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold rounded-full text-sm shadow-lg tracking-wider uppercase transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center space-x-2.5"
            >
              <WhatsAppIcon className="h-5 w-5 text-white" />
              <span>Agendar Cita por WhatsApp</span>
            </a>
            <button
              onClick={() => onNavigate('contacto')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/30 hover:border-white text-white font-bold rounded-full text-sm tracking-wider uppercase transition-colors cursor-pointer"
            >
              💌 Enviar Consulta
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
