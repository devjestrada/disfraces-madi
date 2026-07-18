import React from 'react';
import { Compass, Sparkles, Quote, Award, Calendar, Heart } from 'lucide-react';
import { ASSETS } from '../data';
import type { CatalogCategory } from '../types';

interface NuestraHistoriaProps {
  onNavigate: (view: string, costumeId?: string, category?: CatalogCategory) => void;
}

export default function NuestraHistoria({ onNavigate }: NuestraHistoriaProps) {
  
  const coreValues = [
    {
      icon: <Award className="h-6 w-6 text-[#fdc003]" />,
      title: 'Rigurosidad Histórica',
      desc: 'Estudiamos los patrones históricos de las danzas ancestrales (Congo, Garabato, Cumbia) para que cada traje respete el canon folclórico original.'
    },
    {
      icon: <Heart className="h-6 w-6 text-[#fdc003]" />,
      title: 'Trabajo Justo y Artesanal',
      desc: 'Apoyamos el talento local. Todos nuestros encajes, costuras y bordados son elaborados por madres cabeza de hogar y artesanas del Atlántico.'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-[#fdc003]" />,
      title: 'Brillo y Vanguardia',
      desc: 'Fusionamos los moldes tradicionales con telas cómodas, elásticos ocultos y pedrería suntuosa que resisten el esfuerzo del baile caribe.'
    }
  ];

  return (
    <div className="bg-[#fff8f5] py-12" id="historia-view-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3" id="historia-header">
          <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#fdc003]" />
            Herencia de Carnaval
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1e1b18]">
            La Sra. Madi: Nuestra Alma
          </h1>
          <p className="text-sm sm:text-base text-[#1e1b18]/70 font-sans">
            Más que un taller, somos el latido de una tradición que se viste de gala en cada Batalla de Flores.
          </p>
        </div>

        {/* 1. Portrait Narrative Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24" id="legacy-story-grid">
          
          {/* Sra Madi Narrative (7cols) */}
          <div className="lg:col-span-7 space-y-6" id="legacy-narrative">
            <div className="inline-flex items-center space-x-2 bg-[#a8001a]/10 text-[#a8001a] px-3 py-1 rounded-full text-xs font-semibold font-mono">
              <span>DESDE 2012 EN BARRANQUILLA</span>
            </div>
            
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1e1b18]">
              Herencia de Carnaval
            </h2>
            
            <div className="space-y-4 text-sm sm:text-base text-[#1e1b18]/80 leading-relaxed font-sans">
              <p>
                El nombre Madi es un homenaje a Margarita, nuestra fundadora y madre de Diana. Desde niña, Diana vivió el carnaval en carne propia: fue bailarina y reina en incontables eventos de folclor, siempre acompañada por Margarita y toda la familia, quienes la apoyaron en cada paso.
              </p>
              <p>
                Hoy, cada diseño que nace de Disfraces Madi lleva ese sello familiar: raíces profundamente barranquilleras, vestidas con una mirada moderna. No copiamos el folclor, lo reinventamos — con respeto, con memoria y con corazón.
              </p>
              <p>
                Por eso, cuando alquilas con nosotras, no solo llevas un disfraz. Llevas una historia de familia, de tradición y de cariño hecho diseño.
              </p>
            </div>

            {/* Sra Madi Quote Card */}
            <div className="bg-white p-6 rounded-3xl border-l-4 border-[#a8001a] border-[#a8001a]/10 shadow-sm relative pt-10 mt-6">
              <Quote className="absolute top-4 left-4 h-8 w-8 text-[#a8001a]/10" />
              <p className="text-sm text-[#1e1b18]/85 italic leading-relaxed font-sans">
                "Una pollera de cumbia no es un disfraz cualquiera. Es un instrumento musical que canta cuando la mujer la vuela, es un grito de libertad y libertad es lo que Barranquilla celebra cada año."
              </p>
              <p className="text-xs font-serif font-bold text-[#a8001a] text-right mt-3 font-mono">
                — Sra. Madi, Fundadora y Diseñadora Folclórica
              </p>
            </div>
          </div>

          {/* Atelier Image Box (5cols) */}
          <div className="lg:col-span-5 relative" id="legacy-image-box">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#fdc003]/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#a8001a]/10 rounded-full blur-2xl"></div>
            
            <div className="border border-[#a8001a]/15 rounded-3xl overflow-hidden shadow-xl bg-white p-4 relative z-10">
              <img
                src={ASSETS.atelierMadi}
                alt="Retrato de Sra Madi en su Atelier de Costura"
                className="w-full h-[400px] object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="pt-4 text-center">
                <h4 className="font-serif font-bold text-sm text-[#1e1b18]">Alquiler de Disfraces Madi</h4>
                <p className="text-[11px] text-[#1e1b18]/50 mt-0.5">en Barranquilla</p>
              </div>
            </div>
          </div>

        </div>

        {/* 2. Core Values Bento Layout */}
        <div className="space-y-6 mb-24" id="values-section">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase font-mono text-[#a8001a]">★ VALORES ★</span>
            <h3 className="font-serif text-xl sm:text-3xl font-bold text-[#1e1b18]">Los Hilos que Guían Nuestro Diseño</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" id="values-grid">
            {coreValues.map((val, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-[#a8001a]/10 hover:border-[#a8001a]/25 shadow-xs transition-all text-center space-y-4"
                id={`value-card-${idx}`}
              >
                <div className="bg-[#a8001a] text-white p-3.5 rounded-full inline-flex shadow-sm">
                  {val.icon}
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-lg text-[#1e1b18]">{val.title}</h4>
                <p className="text-xs sm:text-sm text-[#1e1b18]/70 leading-relaxed font-sans">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Action CTA */}
        <div className="bg-[#a8001a] text-white rounded-3xl p-8 md:p-12 text-center space-y-6" id="history-cta">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">¿Deseas lucir un pedazo de nuestra historia?</h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Navega por nuestro catálogo, selecciona una pollera tradicional u obra de fantasía y permítenos entallarla a tu cuerpo de forma impecable.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('catalogo', undefined, 'Todos')}
              className="px-8 py-3.5 bg-[#fdc003] hover:bg-[#fabd00] text-[#1e1b18] font-bold text-sm tracking-wider uppercase rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>🔍 Explorar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
