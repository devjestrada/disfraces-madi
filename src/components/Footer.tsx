import React from 'react';
import { Mail, Phone, MapPin, Clock, Sparkles, Heart } from 'lucide-react';
import { CONTACT_INFO } from '../data';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1e1b18] text-[#fff8f5] pt-16 pb-8 border-t-4 border-[#a8001a]" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12" id="footer-grid">
          {/* Brand Column */}
          <div className="space-y-4" id="footer-brand-col">
            <div className="flex items-center space-x-2">
              <div className="bg-[#a8001a] text-white p-2 rounded-full shadow-md">
                <Sparkles className="h-5 w-5 text-[#fdc003]" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                Disfraces <span className="text-[#fdc003]">Madi</span>
              </span>
            </div>
            <p className="text-sm text-[#fff8f5]/70 leading-relaxed font-sans">
              Preservando la tradición y el brillo del Carnaval de Barranquilla con alta costura, polleras majestuosas y los personajes que hacen latir nuestro patrimonio cultural.
            </p>
            <div className="pt-2">
              <span className="inline-block bg-[#a8001a] text-[#fff8f5] text-[11px] font-mono tracking-widest uppercase px-3 py-1.5 rounded-full font-bold">
                ★ Herencia Carnavalera ★
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4" id="footer-links-col">
            <h3 className="font-serif text-lg font-semibold tracking-wide text-[#fdc003] border-b border-[#fff8f5]/10 pb-2">
              Nuestra Tienda
            </h3>
            <ul className="space-y-3 text-sm text-[#fff8f5]/80 font-medium">
              <li>
                <button onClick={() => onNavigate('inicio')} className="hover:text-[#fdc003] transition-colors cursor-pointer text-left">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalogo')} className="hover:text-[#fdc003] transition-colors cursor-pointer text-left">
                  Explorar Catálogo
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('servicios')} className="hover:text-[#fdc003] transition-colors cursor-pointer text-left">
                  Nuestros Servicios
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('historia')} className="hover:text-[#fdc003] transition-colors cursor-pointer text-left">
                  Nuestra Historia
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contacto')} className="hover:text-[#fdc003] transition-colors cursor-pointer text-left">
                  Ponte en Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Opening Hours Column */}
          <div className="space-y-4" id="footer-hours-col">
            <h3 className="font-serif text-lg font-semibold tracking-wide text-[#fdc003] border-b border-[#fff8f5]/10 pb-2">
              Horario de Atención
            </h3>
            <div className="space-y-3.5 text-sm text-[#fff8f5]/80">
              {CONTACT_INFO.workingHours.map((schedule, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-[#fdc003] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">{schedule.days}</p>
                    <p className="text-xs text-[#fff8f5]/60">{schedule.hours}</p>
                  </div>
                </div>
              ))}
              <div className="bg-[#a8001a]/20 border border-[#a8001a]/30 p-2.5 rounded-lg text-xs text-[#fff8f5]/90">
                <span className="font-bold text-[#fdc003]">¡Nota de Carnaval!</span> Durante los meses de Enero, Febrero y Marzo atendemos domingos y feriados.
              </div>
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4" id="footer-contact-col">
            <h3 className="font-serif text-lg font-semibold tracking-wide text-[#fdc003] border-b border-[#fff8f5]/10 pb-2">
              Contacto Directo
            </h3>
            <ul className="space-y-3.5 text-sm text-[#fff8f5]/80">
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-[#fdc003]" />
                <a href={`https://wa.me/${CONTACT_INFO.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#fdc003] transition-colors font-semibold">
                  WhatsApp: {CONTACT_INFO.phone}
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-[#fdc003]" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-[#fdc003] transition-colors break-all">
                  Email: {CONTACT_INFO.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4" id="footer-bottom-bar">
          <p className="text-xs text-[#fff8f5]/50 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Disfraces Madi. Todos los derechos reservados. Barranquilla, Colombia.
          </p>
          <div className="flex items-center text-xs text-[#fff8f5]/50 space-x-1">
            <span>Hecho con amor y pasión por la tradición</span>
            <Heart className="h-3.5 w-3.5 text-[#a8001a] fill-[#a8001a]" />
            <span>del Carnaval de Barranquilla</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
