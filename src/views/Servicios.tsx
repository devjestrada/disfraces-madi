import React from 'react';
import { Scissors, ShoppingBag, Clock3, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { usePublicData } from '../context/PublicDataContext';

export default function Servicios() {
  const { contactInfo } = usePublicData();
  const coreServices = [
    {
      icon: <Clock3 className="h-8 w-8 text-[#fdc003]" />,
      title: 'Alquiler Presencial Premium',
      desc: 'Elige tu disfraz de nuestro catálogo oficial y visítanos en nuestra boutique en Barranquilla para realizar la prueba. Te aseguramos un talle impecable con nuestro equipo de costureras expertas.',
      features: [
        'Prueba de talle guiada por asesores folclóricos.',
        'Sastrería express incluida en tu reserva para ajuste perfecto.',
        'Sanitización profunda en seco para tu total bioseguridad.',
        'Plazos cómodos de devolución de hasta 4 días hábiles.'
      ]
    },
    {
      icon: <Scissors className="h-8 w-8 text-[#fdc003]" />,
      title: 'Diseño y Confección a Medida',
      desc: '¿Quieres brillar con luz propia con un diseño único? La Sra. Madi y su atelier confeccionan polleras majestuosas, trajes de fantasía deslumbrantes y alegorías de alta costura a la medida exacta de tus sueños.',
      features: [
        'Sesión de bocetado personalizado con la Sra. Madi.',
        'Telas finas importadas y pedrería fina cosida a mano.',
        'Múltiples pruebas de talle previas al ensamble final.',
        'Ideal para Reinas de comparsas, caporales e invitados especiales.'
      ]
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-[#fdc003]" />,
      title: 'Venta de Disfraces Tradicionales',
      desc: '¿Deseas conservar tu vestidura de carnaval como una reliquia familiar o para desfiles internacionales? Confeccionamos réplicas y piezas coleccionables listas para la venta presencial u online.',
      features: [
        'Costuras de alta durabilidad para años de uso.',
        'Accesorios completos incluidos de regalo.',
        'Envíos certificados nacionales e internacionales.',
        'Certificado de autenticidad artesanal barranquillera.'
      ]
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Solicita tu Cita por WhatsApp',
      desc: 'Escríbenos directamente para consultar disponibilidad de fecha y hora cómodas para tu fitting en Alto Prado.'
    },
    {
      number: '02',
      title: 'Prueba, Sastrería & Ajustes',
      desc: 'Pruébate el vestido. Nuestras costureras toman tus medidas y entallan la prenda para que te calce perfecto.'
    },
    {
      number: '03',
      title: 'Recoge Tu Traje Sanitizado',
      desc: 'Retira el traje en un estuche protector hermético, lavado, planchado y listo para lucir en los desfiles.'
    },
    {
      number: '04',
      title: 'Devuélvelo Sin Preocupaciones',
      desc: 'Disfruta de la fiesta y regrésalo en la fecha acordada. Nosotros nos encargamos de todo el lavado clínico.'
    }
  ];

  return (
    <div className="bg-[#fff8f5] py-12" id="servicios-view-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3" id="servicios-header">
          <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#fdc003]" />
            Nuestros Servicios
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1e1b18]">
            Tradición Confeccionada con Pasión
          </h1>
          <p className="text-sm sm:text-base text-[#1e1b18]/70 font-sans">
            Ofrecemos soluciones integrales y cómodas para que vivas la experiencia del carnaval con toda la distinción, higiene y holgura que te mereces.
          </p>
        </div>

        {/* 1. Core Services Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24" id="core-services-grid">
          {coreServices.map((service, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-[#a8001a]/10 hover:border-[#a8001a]/30 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6"
              id={`service-card-${idx}`}
            >
              <div className="space-y-4">
                <div className="bg-[#a8001a] p-3.5 rounded-2xl inline-block shadow-md">
                  {service.icon}
                </div>
                
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1e1b18]">
                  {service.title}
                </h3>
                
                <p className="text-xs sm:text-sm text-[#1e1b18]/75 leading-relaxed font-sans">
                  {service.desc}
                </p>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider font-mono text-[#a8001a] mb-2.5">Beneficios Clave:</p>
                  <ul className="space-y-2 text-xs text-[#1e1b18]/85 font-medium">
                    {service.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-[#a8001a] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-[#a8001a]/10 pt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1e1b18]/45 uppercase font-mono">Tarifas</span>
                <a
                  href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(`Hola Sra. Madi, me gustaría consultar tarifas y disponibilidad para el servicio de: "${service.title}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25d366]/10 hover:bg-[#25d366]/20 text-[#128c7e] text-xs font-bold px-3 py-1.5 rounded-lg font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5 text-current" />
                  <span>A tu Presupuesto</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Process / How it Works */}
        <div className="bg-[#1e1b18] text-[#fff8f5] rounded-3xl p-8 md:p-16 mb-24 relative overflow-hidden" id="process-section">
          <div className="absolute right-0 bottom-0 opacity-5">
            <Scissors className="h-96 w-96 text-white" />
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-center mb-16 space-y-3">
            <span className="text-[#fdc003] text-xs font-bold uppercase tracking-widest font-mono">✦ PROCESO MADI ✦</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold">Tu Tranquilidad es Nuestra Prioridad</h2>
            <p className="text-sm text-[#fff8f5]/70 max-w-xl mx-auto">
              Te acompañamos de inicio a fin para que tu única labor sea gozar, bailar y sonreír al compás de los tambores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10" id="steps-grid">
            {steps.map((step, idx) => (
              <div key={idx} className="space-y-3 relative group" id={`process-step-${idx}`}>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-[#fdc003]/30 group-hover:text-[#fdc003] transition-colors duration-300 font-mono">
                    {step.number}
                  </span>
                  {idx < 3 && (
                    <div className="hidden lg:block w-20 h-0.5 border-t-2 border-dashed border-[#fff8f5]/15 absolute right-[-2.5rem] top-6"></div>
                  )}
                </div>
                <h4 className="font-serif font-bold text-sm sm:text-base text-white">{step.title}</h4>
                <p className="text-xs text-[#fff8f5]/65 leading-relaxed font-sans">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Action Banner */}
        <div className="bg-[#a8001a] text-white rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden shadow-xl" id="servicios-cta">
          <div className="absolute left-6 top-6 opacity-10">
            <Calendar className="h-48 w-48 text-white" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">¿Deseas visitarnos para un Fitting Presencial?</h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Nuestra atención es totalmente exclusiva y humana, por lo que no realizamos agendas sistematizadas automáticas. Agenda tu cita de fitting previa disponibilidad de manera directa con nosotros a través de WhatsApp.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, me gustaría solicitar disponibilidad para agendar una cita de fitting presencial en la boutique.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-sm tracking-wider uppercase rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center space-x-2.5"
            >
              <WhatsAppIcon className="h-5 w-5 text-white" />
              <span>Solicitar Cita por WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
