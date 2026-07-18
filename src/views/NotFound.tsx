import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="bg-[#fff8f5] py-24 sm:py-32" id="not-found-view-root">
      <div className="max-w-xl mx-auto px-4 text-center space-y-6">
        <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#fdc003]" />
          Página no encontrada
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1e1b18]">
          Esta página se perdió en el desfile
        </h1>
        <p className="text-sm sm:text-base text-[#1e1b18]/70">
          El enlace que buscas no existe o ya no está disponible. Volvamos a la fiesta y encontremos juntas el disfraz que estás buscando.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-[#a8001a] hover:bg-[#920014] text-[#fff8f5] font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <Compass className="h-5 w-5 text-[#fdc003]" />
            <span>Volver a Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
