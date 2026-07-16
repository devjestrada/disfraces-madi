import React from 'react';
import { Mail, Clock, Sparkles } from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { usePublicData } from '../context/PublicDataContext';

export default function Contacto() {
  const { contactInfo } = usePublicData();

  return (
    <div className="bg-[#fff8f5] py-12" id="contacto-view-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3" id="contacto-header">
          <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#fdc003]" />
            Atención al Cliente
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1e1b18]">
            Ponte en Contacto
          </h1>
          <p className="text-sm sm:text-base text-[#1e1b18]/70 font-sans">
            ¿Tienes alguna pregunta sobre tallas, disponibilidad o quieres cotizar un diseño folclórico? Escríbenos directamente por WhatsApp y te responderemos en minutos.
          </p>
        </div>

        {/* Main Content: Focused entirely on WhatsApp Contact & Personalized Visit */}
        <div className="max-w-2xl mx-auto space-y-8" id="contacto-main-layout">
          
          {/* WhatsApp Premium Card */}
          <div className="bg-[#1e1b18] text-white p-6 sm:p-10 rounded-3xl space-y-6 shadow-lg border-b-4 border-[#a8001a] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <WhatsAppIcon className="w-40 h-40 text-white" />
            </div>

            <div className="space-y-3">
              <span className="bg-[#a8001a] text-[#fff8f5] text-[10px] font-mono tracking-widest font-bold uppercase px-3 py-1.5 rounded-full shadow-sm inline-block">
                ★ Canal de Atención Único ★
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#fdc003] pt-1">Atención Inmediata</h3>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                En Disfraces Madi no realizamos agendas sistematizadas automáticas. Gestionamos todas las citas, cotizaciones y consultas directa y humanamente por WhatsApp para verificar disponibilidad de fecha y hora cómodas para tu fitting y brindarte una experiencia totalmente exclusiva.
              </p>
            </div>
            
            <div className="space-y-4 pt-2">
              <a
                href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, me gustaría agendar una cita de fitting y conversar sobre un diseño personalizado para el Carnaval.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-sm uppercase tracking-widest rounded-full shadow-lg flex items-center justify-center space-x-3 transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
              >
                <WhatsAppIcon className="h-6 w-6 text-white" />
                <span>Chatear por WhatsApp</span>
              </a>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-4 text-sm text-white/90">
              <a
                href={`https://wa.me/${contactInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-3 group cursor-pointer hover:text-[#fdc003] transition-colors"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#fdc003] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white group-hover:underline">WhatsApp Directo</p>
                  <p className="text-white/70">{contactInfo.phone}</p>
                </div>
              </a>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-[#fdc003] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Correo Electrónico (Respaldo)</p>
                  <p className="text-white/70 break-all">{contactInfo.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-3.5">
              <h4 className="font-serif font-bold text-xs text-[#fdc003] flex items-center space-x-1.5 uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                <span>Horario de Atención</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-white/75">
                {contactInfo.workingHours.map((schedule, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <p className="font-semibold text-white">{schedule.days}</p>
                    <p className="text-[10px] text-white/50">{schedule.hours}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personalized Visit Callout Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#a8001a]/10 shadow-sm space-y-5" id="visitas-personalizadas-card">
            <div className="flex items-center space-x-2 border-b border-[#a8001a]/10 pb-3">
              <Sparkles className="h-5 w-5 text-[#a8001a]" />
              <h4 className="font-serif font-bold text-lg text-[#1e1b18]">Pruebas y Visitas de Fitting</h4>
            </div>

            <p className="text-sm text-[#1e1b18]/70 leading-relaxed font-sans">
              Para garantizar la exclusividad y la dedicación que merece tu diseño de carnaval, atendemos <strong>únicamente bajo cita previa</strong>.
            </p>

            <div className="bg-[#a8001a]/5 p-4 rounded-2xl border border-[#a8001a]/10 text-xs sm:text-sm text-[#1e1b18] leading-relaxed space-y-1.5">
              <p className="font-bold text-[#a8001a] font-serif text-sm">Precios a tu Presupuesto</p>
              <p className="text-[#1e1b18]/75">
                Durante tu fitting, acordaremos un precio de alquiler personalizado que responda con generosidad a tus recursos y presupuesto. ¡Conversemos!
              </p>
            </div>


          </div>

        </div>
      </div>
    </div>
  );
}
