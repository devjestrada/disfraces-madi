import React from 'react';
import { Compass, Sparkles, Star, Quote, Award, Calendar, Heart, ShieldAlert } from 'lucide-react';
import { ASSETS, STATS } from '../data';

interface NuestraHistoriaProps {
  onNavigate: (view: string) => void;
}

export default function NuestraHistoria({ onNavigate }: NuestraHistoriaProps) {
  const timelineEvents = [
    {
      year: '1991',
      title: 'El Primer Hilo',
      desc: 'Sra. Madi abre un humilde taller de costura en Barrio Abajo, cosiendo polleras sencillas de cuadros rojos para sus sobrinas y vecinas.'
    },
    {
      year: '2003',
      title: 'Reconocimiento Folclórico',
      desc: 'Nuestros diseños ganan por primera vez el premio a "Mejor Vestuario Tradicional" en la Gran Parada de Tradición de la Vía 40.'
    },
    {
      year: '2012',
      title: 'Nueva Boutique Alto Prado',
      desc: 'Nos mudamos a nuestra sede actual en Alto Prado, expandiendo la capacidad para albergar más de 1,000 trajes históricos de catálogo.'
    },
    {
      year: '2020',
      title: 'Patrimonio Protegido',
      desc: 'Iniciamos el programa de conservación y restauración de piezas textiles antiguas para salvaguardar las técnicas de costura en desuso.'
    }
  ];

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
            La Sra. Madi y su Legado
          </h1>
          <p className="text-sm sm:text-base text-[#1e1b18]/70 font-sans">
            Una historia tejida con hilos de oro, lentejuelas, y la pasión inquebrantable de tres generaciones dedicadas a vestir los corazones del Carnaval de Barranquilla.
          </p>
        </div>

        {/* 1. Portrait Narrative Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24" id="legacy-story-grid">
          
          {/* Sra Madi Narrative (7cols) */}
          <div className="lg:col-span-7 space-y-6" id="legacy-narrative">
            <div className="inline-flex items-center space-x-2 bg-[#a8001a]/10 text-[#a8001a] px-3 py-1 rounded-full text-xs font-semibold font-mono">
              <span>DESDE 1991 EN BARRANQUILLA</span>
            </div>
            
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1e1b18]">
              Nuestras Raíces: De Barrio Abajo al Alto Prado
            </h2>
            
            <div className="space-y-4 text-sm sm:text-base text-[#1e1b18]/80 leading-relaxed font-sans">
              <p>
                Sra. Madi creció mecida por los acordes de la flauta de millo y las risas de las tejedoras en los patios de Barrio Abajo. Desde pequeña, observaba con fascinación cómo las abuelas transformaban retazos de algodón rústico en las majestuosas polleras que inundaban las calles cada febrero.
              </p>
              <p>
                En 1991, convencida de que el patrimonio de Barranquilla merecía ser vestido con la suntuosidad de la alta costura europea pero sin perder el sudor y el gozo de la calle, adquirió su primera máquina de coser Singer manual. Así nació el Taller Madi.
              </p>
              <p>
                Con el paso de los años, lo que inició como un servicio íntimo de costura familiar se convirtió en el punto de encuentro obligatorio de Reinas de comparsas, bailarines dedicados y embajadores culturales de Colombia en el extranjero. Hoy, Disfraces Madi combina esa tradición intacta con una infraestructura moderna de lavado clínico, sastrería express y reservas virtuales.
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
                <h4 className="font-serif font-bold text-sm text-[#1e1b18]">Atelier de Alta Costura Madi</h4>
                <p className="text-[11px] text-[#1e1b18]/50 mt-0.5">Sede Alto Prado, Barranquilla</p>
              </div>
            </div>
          </div>

        </div>

        {/* 2. Core Values Bento Layout */}
        <div className="space-y-6 mb-24" id="values-section">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase font-mono text-[#a8001a]">★ VALORES ★</span>
            <h3 className="font-serif text-xl sm:text-3xl font-bold text-[#1e1b18]">Los Hilos que Guían Nuestra Aguja</h3>
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

        {/* 3. Interactive Timeline */}
        <div className="bg-[#1e1b18] text-[#fff8f5] rounded-3xl p-8 md:p-16 mb-24" id="timeline-section">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[#fdc003] text-xs font-bold uppercase tracking-widest font-mono">✦ HISTORIA EN HITOS ✦</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold">Nuestra Trayectoria Folclórica</h3>
            <p className="text-xs sm:text-sm text-[#fff8f5]/65">Un camino de perseverancia, puntadas cuidadosas y aplausos en el desfile.</p>
          </div>

          <div className="relative border-l border-white/10 ml-4 md:ml-32 space-y-12" id="timeline-container">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="relative pl-8 md:pl-12 group" id={`timeline-event-${idx}`}>
                {/* Year tag for large screens */}
                <span className="hidden md:block absolute left-[-8rem] top-1.5 font-serif font-bold text-2xl text-[#fdc003] w-24 text-right">
                  {evt.year}
                </span>

                {/* Point indicator */}
                <span className="absolute left-[-5px] top-3.5 h-2.5 w-2.5 bg-[#fdc003] rounded-full ring-4 ring-[#1e1b18] group-hover:scale-125 transition-transform"></span>

                {/* Event Card */}
                <div className="space-y-1.5">
                  <span className="md:hidden inline-block font-mono font-bold text-sm text-[#fdc003] bg-white/10 px-2 py-0.5 rounded-md mb-2">
                    {evt.year}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-white group-hover:text-[#fdc003] transition-colors">{evt.title}</h4>
                  <p className="text-xs sm:text-sm text-[#fff8f5]/70 leading-relaxed max-w-2xl font-sans">{evt.desc}</p>
                </div>
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
              onClick={() => onNavigate('catalogo')}
              className="px-8 py-3.5 bg-[#fdc003] hover:bg-[#fabd00] text-[#1e1b18] font-bold text-sm tracking-wider uppercase rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center space-x-2"
            >
              <span>🔍 Explorar Catálogo de Costura</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
