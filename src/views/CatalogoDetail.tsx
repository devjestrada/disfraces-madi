import React, { useState } from 'react';
import { Heart, Sparkles, Ruler, CheckCircle, ArrowLeft } from 'lucide-react';
import { COSTUMES } from '../data';
import { usePublicData } from '../context/PublicDataContext';
import { Costume } from '../types';

interface CatalogoDetailProps {
  costumeId?: string;
  costumeProp?: Costume;
  onNavigate: (view: string, costumeId?: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export default function CatalogoDetail({ costumeId, costumeProp, onNavigate, favorites, onToggleFavorite }: CatalogoDetailProps) {
  const costume = costumeProp ?? (COSTUMES.find((c) => c.id === costumeId) || COSTUMES[0]);

  const [activeImage, setActiveImage] = useState(costume.primaryImage);
  const [selectedSize, setSelectedSize] = useState<string>(costume.sizes[0]);
  const [activeTab, setActiveTab] = useState<'materiales' | 'accesorios' | 'confeccion'>('materiales');

  const isFav = favorites.includes(costume.id);

  const { contactInfo } = usePublicData();

  const handleWhatsAppInquiry = () => {
    const text = `Hola Sra. Madi, me interesa consultar el alquiler del vestido de carnaval "${costume.name}" en talla ${selectedSize}. ¿Tienen disponibilidad?`;
    const formattedText = encodeURIComponent(text);
    const url = `https://wa.me/${contactInfo.whatsapp}?text=${formattedText}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-[#fff8f5] py-8 sm:py-12" id="catalogo-detail-view-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs & Back Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8" id="detail-nav-header">
          <button
            onClick={() => onNavigate('catalogo')}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-[#a8001a] hover:text-[#920014] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Volver al Catálogo</span>
          </button>
          
          <div className="text-xs sm:text-sm font-medium text-[#1e1b18]/60 font-mono">
            Catálogo &gt; {costume.category} &gt; <span className="text-[#a8001a] font-bold">{costume.name}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white p-6 sm:p-10 rounded-3xl border border-[#a8001a]/10 shadow-sm" id="detail-content-grid">
          
          {/* Column 1: Image Gallery (5cols) */}
          <div className="lg:col-span-5 space-y-4" id="detail-images-column">
            {/* Main Image */}
            <div className="relative h-[480px] sm:h-[540px] rounded-2xl overflow-hidden bg-gray-50 border border-[#a8001a]/5 shadow-sm">
              <img
                src={activeImage}
                alt={costume.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Badges Overlays */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                <span className="bg-[#a8001a] text-white text-[10px] font-mono tracking-wider font-bold uppercase px-3 py-1.5 rounded-full shadow-md">
                  {costume.category}
                </span>
                {costume.featured && (
                  <span className="bg-[#fdc003] text-[#1e1b18] text-[10px] font-mono tracking-wider font-bold uppercase px-3 py-1.5 rounded-full shadow-md">
                    ★ Premium Madi
                  </span>
                )}
                <span className={`text-[10px] font-mono tracking-wider font-bold uppercase px-3 py-1.5 rounded-full shadow-md ${costume.isAvailable ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {costume.isAvailable ? '● Disponible para Alquiler' : '● Reservado / No Disponible'}
                </span>
              </div>

              {/* Favorites trigger */}
              <button
                onClick={() => onToggleFavorite(costume.id)}
                className="absolute top-4 right-4 bg-white hover:bg-[#fff8f5] p-2.5 rounded-full shadow-md text-gray-500 hover:text-[#a8001a] transition-all cursor-pointer"
                title="Añadir a Favoritos"
              >
                <Heart className={`h-5 w-5 ${isFav ? 'fill-[#a8001a] text-[#a8001a]' : 'text-[#1e1b18]/70'}`} />
              </button>
            </div>

            {/* Thumbnails list */}
            {costume.gallery.length > 1 && (
              <div className="grid grid-cols-3 gap-3" id="detail-thumbnails-grid">
                {costume.gallery.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`h-24 sm:h-28 rounded-xl overflow-hidden border-2 bg-gray-100 transition-all cursor-pointer ${
                      activeImage === imgUrl ? 'border-[#a8001a] shadow-md scale-95' : 'border-[#a8001a]/10 hover:border-[#a8001a]/30'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${costume.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Costume Specs & Booking (7cols) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between" id="detail-specs-column">
            
            {/* Header metadata */}
            <div className="space-y-3">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1e1b18]">
                {costume.name}
              </h1>
              {costume.designer && (
                <p className="text-xs sm:text-sm font-semibold text-[#a8001a] font-mono uppercase tracking-wider !mt-1">
                  Diseño de: <span className="font-serif italic font-extrabold capitalize text-[#1e1b18] text-sm sm:text-base">{costume.designer}</span>
                </p>
              )}

              {/* Personalized Alquiler Note / No Price Visible */}
              <div className="bg-[#a8001a]/5 p-5 rounded-2xl border border-[#a8001a]/15 space-y-3 !mt-4">
                <div className="flex items-center space-x-2 text-[#a8001a]">
                  <Sparkles className="h-4.5 w-4.5 text-[#fdc003]" />
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">Alquiler Personalizado</p>
                </div>
                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-serif font-bold text-[#1e1b18]">
                    Precios adaptados a tu presupuesto, conversemos en tu visita
                  </p>
                  <p className="text-xs text-[#1e1b18]/70 leading-relaxed font-sans">
                    En Disfraces Madi creemos en la inclusión y accesibilidad de la tradición del Carnaval. El alquiler de cada pieza se acuerda de manera individualizada durante tu visita de prueba presencial de fitting, adaptándonos de forma positiva y profesional a tus necesidades y recursos.
                  </p>
                </div>
                <div className="pt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#846524] font-bold font-mono uppercase">
                  <span>★ Tintorería Especializada Incluida</span>
                  <span>★ Ajustes a Medida de Sastrería Incluidos</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <p className="text-sm text-[#1e1b18]/75 leading-relaxed font-sans">
                {costume.description}
              </p>
            </div>

            {/* Interactive Tabs Section */}
            <div className="space-y-4" id="detail-tabs">
              <div className="flex border-b border-[#a8001a]/15">
                <button
                  onClick={() => setActiveTab('materiales')}
                  className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-[2px] ${
                    activeTab === 'materiales'
                      ? 'border-[#a8001a] text-[#a8001a]'
                      : 'border-transparent text-[#1e1b18]/60 hover:text-[#a8001a]'
                  }`}
                >
                  Artesanía y Telas
                </button>
                <button
                  onClick={() => setActiveTab('accesorios')}
                  className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-[2px] ${
                    activeTab === 'accesorios'
                      ? 'border-[#a8001a] text-[#a8001a]'
                      : 'border-transparent text-[#1e1b18]/60 hover:text-[#a8001a]'
                  }`}
                >
                  Accesorios Incluidos
                </button>
                <button
                  onClick={() => setActiveTab('confeccion')}
                  className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-[2px] ${
                    activeTab === 'confeccion'
                      ? 'border-[#a8001a] text-[#a8001a]'
                      : 'border-transparent text-[#1e1b18]/60 hover:text-[#a8001a]'
                  }`}
                >
                  Características
                </button>
              </div>

              <div className="min-h-36 py-2">
                {activeTab === 'materiales' && (
                  <div className="space-y-2 animate-fadeIn">
                    <p className="text-xs text-[#1e1b18]/50 font-semibold uppercase font-mono">Tejidos y Encajes seleccionados por Sra. Madi:</p>
                    <div className="flex flex-wrap gap-2">
                      {costume.fabrics.map((fabric, idx) => (
                        <span key={idx} className="bg-white border border-[#a8001a]/15 text-[#1e1b18]/85 text-xs px-3.5 py-1.5 rounded-lg shadow-xs font-medium">
                          {fabric}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[#1e1b18]/60 italic mt-3 font-sans">
                      *Telas frescas de alta tecnología transpirable ideales para el caluroso clima del Caribe colombiano.
                    </p>
                  </div>
                )}

                {activeTab === 'accesorios' && (
                  <div className="space-y-2 animate-fadeIn">
                    <p className="text-xs text-[#1e1b18]/50 font-semibold uppercase font-mono">El alquiler completo incluye los siguientes accesorios tradicionales:</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1e1b18]/80 font-medium">
                      {costume.accessories.map((acc, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-[#a8001a] shrink-0" />
                          <span>{acc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'confeccion' && (
                  <div className="space-y-2 animate-fadeIn">
                    <p className="text-xs text-[#1e1b18]/50 font-semibold uppercase font-mono">Garantías técnicas de confección de alta costura:</p>
                    <ul className="space-y-2 text-xs text-[#1e1b18]/75 font-medium leading-relaxed">
                      {costume.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Sparkles className="h-4 w-4 text-[#fdc003] shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3 border-t border-[#a8001a]/10 pt-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase font-mono text-[#1e1b18]/70">
                <span className="flex items-center space-x-1">
                  <Ruler className="h-4 w-4 text-[#a8001a]" />
                  <span>Escoge tu Talla</span>
                </span>
                <span className="text-[10px] text-[#1e1b18]/40">Ajustable por sastre</span>
              </div>
              
              <div className="flex flex-wrap gap-2.5" id="detail-sizes-selector">
                {costume.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 px-4 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'bg-[#a8001a] text-white border-transparent shadow-md scale-95'
                        : 'bg-white border-[#a8001a]/15 text-[#1e1b18] hover:border-[#a8001a]/40'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Actions Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#a8001a]/10 pt-6" id="detail-action-buttons">
              <button
                onClick={() => {
                  const text = `Hola Sra. Madi, me gustaría solicitar disponibilidad para agendar una cita de fitting presencial para probarme el disfraz "${costume.name}" en talla ${selectedSize}.`;
                  window.open(`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full h-14 bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-sm tracking-wider uppercase rounded-full shadow-lg flex items-center justify-center space-x-2.5 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.486 1.98 14.007.953 11.39.953c-5.446 0-9.873 4.373-9.877 9.802-.001 1.83.49 3.61 1.42 5.176l-1.02 3.722 3.843-1.002zm12.246-7.394c-.33-.164-1.953-.964-2.253-1.074-.3-.109-.519-.164-.738.164-.219.329-.848 1.074-1.039 1.293-.19.22-.382.247-.712.082-.33-.164-1.393-.513-2.653-1.637-.98-.874-1.642-1.954-1.833-2.283-.19-.33-.02-.508.145-.671.149-.147.33-.384.495-.576.164-.191.219-.329.329-.548.11-.219.055-.411-.028-.576-.082-.164-.738-1.78-.1-2.438-.1-.247-.4-.329-.519-.164-.33-.082-.848-.274-1.177-.055-.329.219-1.286 1.26-1.286 3.07s1.314 3.56 1.496 3.807c.182.247 2.586 3.95 6.263 5.54.875.378 1.56.602 2.09.771.88.279 1.68.239 2.31.145.7-.104 1.953-.8 2.227-1.574.273-.774.273-1.438.191-1.574-.082-.136-.3-.219-.63-.383z"/>
                </svg>
                <span>Agendar por WhatsApp</span>
              </button>
              
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full h-14 bg-white hover:bg-green-50/20 border-2 border-[#25d366] hover:border-[#20ba5a] text-[#128c7e] font-bold text-sm tracking-wider uppercase rounded-full flex items-center justify-center space-x-2.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <svg className="h-5 w-5 fill-current text-[#25d366]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.486 1.98 14.007.953 11.39.953c-5.446 0-9.873 4.373-9.877 9.802-.001 1.83.49 3.61 1.42 5.176l-1.02 3.722 3.843-1.002zm12.246-7.394c-.33-.164-1.953-.964-2.253-1.074-.3-.109-.519-.164-.738.164-.219.329-.848 1.074-1.039 1.293-.19.22-.382.247-.712.082-.33-.164-1.393-.513-2.653-1.637-.98-.874-1.642-1.954-1.833-2.283-.19-.33-.02-.508.145-.671.149-.147.33-.384.495-.576.164-.191.219-.329.329-.548.11-.219.055-.411-.028-.576-.082-.164-.738-1.78-.1-2.438-.1-.247-.4-.329-.519-.164-.33-.082-.848-.274-1.177-.055-.329.219-1.286 1.26-1.286 3.07s1.314 3.56 1.496 3.807c.182.247 2.586 3.95 6.263 5.54.875.378 1.56.602 2.09.771.88.279 1.68.239 2.31.145.7-.104 1.953-.8 2.227-1.574.273-.774.273-1.438.191-1.574-.082-.136-.3-.219-.63-.383z"/>
                </svg>
                <span>Consultar por WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
