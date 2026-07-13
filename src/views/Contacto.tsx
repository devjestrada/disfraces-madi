import React from 'react';
import { Mail, Clock, Sparkles, CheckCircle } from 'lucide-react';
import { CONTACT_INFO } from '../data';

export default function Contacto() {
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
              <svg className="w-40 h-40 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.486 1.98 14.007.953 11.39.953c-5.446 0-9.873 4.373-9.877 9.802-.001 1.83.49 3.61 1.42 5.176l-1.02 3.722 3.843-1.002zm12.246-7.394c-.33-.164-1.953-.964-2.253-1.074-.3-.109-.519-.164-.738.164-.219.329-.848 1.074-1.039 1.293-.19.22-.382.247-.712.082-.33-.164-1.393-.513-2.653-1.637-.98-.874-1.642-1.954-1.833-2.283-.19-.33-.02-.508.145-.671.149-.147.33-.384.495-.576.164-.191.219-.329.329-.548.11-.219.055-.411-.028-.576-.082-.164-.738-1.78-.1-2.438-.1-.247-.4-.329-.519-.164-.33-.082-.848-.274-1.177-.055-.329.219-1.286 1.26-1.286 3.07s1.314 3.56 1.496 3.807c.182.247 2.586 3.95 6.263 5.54.875.378 1.56.602 2.09.771.88.279 1.68.239 2.31.145.7-.104 1.953-.8 2.227-1.574.273-.774.273-1.438.191-1.574-.082-.136-.3-.219-.63-.383z"/>
              </svg>
            </div>

            <div className="space-y-3">
              <span className="bg-[#a8001a] text-[#fff8f5] text-[10px] font-mono tracking-widest font-bold uppercase px-3 py-1.5 rounded-full shadow-sm inline-block">
                ★ Canal de Atención Único ★
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#fdc003] pt-1">Atención Inmediata</h3>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                En Atelier Madi no realizamos agendas sistematizadas automáticas. Gestionamos todas las citas, cotizaciones y consultas directa y humanamente por WhatsApp para verificar disponibilidad de fecha y hora cómodas para tu fitting y brindarte una experiencia totalmente exclusiva.
              </p>
            </div>
            
            <div className="space-y-4 pt-2">
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, me gustaría agendar una cita de fitting y conversar sobre un diseño personalizado para el Carnaval.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-sm uppercase tracking-widest rounded-full shadow-lg flex items-center justify-center space-x-3 transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
              >
                {/* Custom inline WhatsApp SVG */}
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.486 1.98 14.007.953 11.39.953c-5.446 0-9.873 4.373-9.877 9.802-.001 1.83.49 3.61 1.42 5.176l-1.02 3.722 3.843-1.002zm12.246-7.394c-.33-.164-1.953-.964-2.253-1.074-.3-.109-.519-.164-.738.164-.219.329-.848 1.074-1.039 1.293-.19.22-.382.247-.712.082-.33-.164-1.393-.513-2.653-1.637-.98-.874-1.642-1.954-1.833-2.283-.19-.33-.02-.508.145-.671.149-.147.33-.384.495-.576.164-.191.219-.329.329-.548.11-.219.055-.411-.028-.576-.082-.164-.738-1.78-.1-2.438-.1-.247-.4-.329-.519-.164-.33-.082-.848-.274-1.177-.055-.329.219-1.286 1.26-1.286 3.07s1.314 3.56 1.496 3.807c.182.247 2.586 3.95 6.263 5.54.875.378 1.56.602 2.09.771.88.279 1.68.239 2.31.145.7-.104 1.953-.8 2.227-1.574.273-.774.273-1.438.191-1.574-.082-.136-.3-.219-.63-.383z"/>
                </svg>
                <span>Chatear por WhatsApp</span>
              </a>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-4 text-sm text-white/90">
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-3 group cursor-pointer hover:text-[#fdc003] transition-colors"
              >
                <svg className="h-5 w-5 fill-[#fdc003] shrink-0 mt-0.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.486 1.98 14.007.953 11.39.953c-5.446 0-9.873 4.373-9.877 9.802-.001 1.83.49 3.61 1.42 5.176l-1.02 3.722 3.843-1.002zm12.246-7.394c-.33-.164-1.953-.964-2.253-1.074-.3-.109-.519-.164-.738.164-.219.329-.848 1.074-1.039 1.293-.19.22-.382.247-.712.082-.33-.164-1.393-.513-2.653-1.637-.98-.874-1.642-1.954-1.833-2.283-.19-.33-.02-.508.145-.671.149-.147.33-.384.495-.576.164-.191.219-.329.329-.548.11-.219.055-.411-.028-.576-.082-.164-.738-1.78-.1-2.438-.1-.247-.4-.329-.519-.164-.33-.082-.848-.274-1.177-.055-.329.219-1.286 1.26-1.286 3.07s1.314 3.56 1.496 3.807c.182.247 2.586 3.95 6.263 5.54.875.378 1.56.602 2.09.771.88.279 1.68.239 2.31.145.7-.104 1.953-.8 2.227-1.574.273-.774.273-1.438.191-1.574-.082-.136-.3-.219-.63-.383z"/>
                </svg>
                <div>
                  <p className="font-semibold text-white group-hover:underline">WhatsApp Directo</p>
                  <p className="text-white/70">{CONTACT_INFO.phone}</p>
                </div>
              </a>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-[#fdc003] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Correo Electrónico (Respaldo)</p>
                  <p className="text-white/70 break-all">{CONTACT_INFO.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-3.5">
              <h4 className="font-serif font-bold text-xs text-[#fdc003] flex items-center space-x-1.5 uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                <span>Horario de Atención</span>
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-white/75">
                {CONTACT_INFO.workingHours.map((schedule, idx) => (
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

            <div className="text-xs sm:text-sm text-[#1e1b18]/65 leading-relaxed font-sans flex items-start space-x-2.5">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <p>
                <strong>Medidas Sanitarias:</strong> Todas las prendas son sometidas a un protocolo riguroso de desinfección en seco antes de tu fitting presencial para garantizar tu absoluta seguridad.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
