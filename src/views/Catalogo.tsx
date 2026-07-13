import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Star, Heart, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Costume } from '../types';
import { COSTUMES, CONTACT_INFO } from '../data';

interface CatalogoProps {
  onNavigate: (view: string, costumeId?: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

type CategoryFilter = 'Todos' | 'Tradicional' | 'Fantasía' | 'Comparsa' | 'Infantil';
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating-desc';

export default function Catalogo({ onNavigate, favorites, onToggleFavorite }: CatalogoProps) {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Todos');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // List of sizes available for filtering
  const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Toggle size filter
  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Filtered and Sorted costumes
  const filteredCostumes = useMemo(() => {
    let result = [...COSTUMES];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.fabrics.some((f) => f.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'Todos') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Sizes
    if (selectedSizes.length > 0) {
      result = result.filter((c) => c.sizes.some((size) => selectedSizes.includes(size)));
    }

    // Availability
    if (onlyAvailable) {
      result = result.filter((c) => c.isAvailable);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.rentalPrice - b.rentalPrice);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.rentalPrice - a.rentalPrice);
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedSizes, onlyAvailable, sortBy]);

  // Format price helper
  const formatCOP = (num: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedSizes([]);
    setOnlyAvailable(false);
    setSortBy('default');
  };

  return (
    <div className="bg-[#fff8f5] py-12" id="catalogo-view-root">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3" id="catalogo-header">
          <span className="text-[#a8001a] text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#fdc003]" />
            Colección Oficial de Carnaval
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#1e1b18]">
            Explora Nuestra Colección
          </h1>
          <p className="text-sm sm:text-base text-[#1e1b18]/70">
            Encuentra polleras, trajes imperiales de fantasía y disfraces tradicionales restaurados, sanitizados y ajustados a tu medida exacta.
          </p>
        </div>

        {/* Main Grid: Filters Sidebar + Costume Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start" id="catalogo-main-layout">
          
          {/* Filters Sidebar */}
          <aside className="bg-white p-6 rounded-2xl border border-[#a8001a]/10 shadow-sm space-y-8 lg:sticky lg:top-24" id="catalogo-filters-sidebar">
            <div className="flex items-center justify-between border-b border-[#a8001a]/10 pb-4">
              <div className="flex items-center space-x-2 text-[#1e1b18]">
                <SlidersHorizontal className="h-5 w-5 text-[#a8001a]" />
                <h2 className="font-serif font-bold text-lg">Filtros</h2>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[#a8001a] hover:text-[#920014] underline cursor-pointer"
              >
                Limpiar todo
              </button>
            </div>

            {/* 1. Search Bar */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1e1b18]/70 uppercase tracking-wide font-mono">
                Buscar Costume
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Cumbia, Lentejuelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#a8001a]/10 rounded-xl text-sm outline-none focus:border-[#a8001a] focus:ring-1 focus:ring-[#a8001a]/20 bg-[#fff8f5]/50"
                />
                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-[#1e1b18]/40" />
              </div>
            </div>

            {/* 2. Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#1e1b18]/70 uppercase tracking-wide font-mono block">
                Categoría
              </label>
              <div className="space-y-1.5 flex flex-col">
                {(['Todos', 'Tradicional', 'Fantasía', 'Comparsa', 'Infantil'] as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#a8001a]/10 text-[#a8001a] font-semibold border-l-3 border-[#a8001a]'
                        : 'text-[#1e1b18]/80 hover:bg-[#a8001a]/5 hover:text-[#a8001a]'
                    }`}
                  >
                    {cat === 'Todos' ? 'Todas las categorías' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sizes Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#1e1b18]/70 uppercase tracking-wide font-mono block">
                Tallas Disponibles
              </label>
              <div className="grid grid-cols-3 gap-2" id="sizes-filter-grid">
                {allSizes.map((size) => {
                  const isChecked = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => handleSizeToggle(size)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#a8001a] text-white border-transparent shadow'
                          : 'bg-white border-[#a8001a]/15 text-[#1e1b18]/75 hover:border-[#a8001a]/40'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Availability Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-[#a8001a]/10">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#1e1b18]/85 font-mono">Solo Disponibles</span>
                <span className="text-[10px] text-[#1e1b18]/50">Alquiler inmediato</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#a8001a]"></div>
              </label>
            </div>

            {/* 5. Sort Dropdown */}
            <div className="space-y-2 border-t border-[#a8001a]/10 pt-4">
              <label className="text-xs font-bold text-[#1e1b18]/70 uppercase tracking-wide font-mono block">
                Ordenar Por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-[#a8001a]/10 rounded-xl text-sm outline-none bg-white focus:border-[#a8001a] cursor-pointer"
              >
                <option value="default">Recomendados</option>
                <option value="rating-desc">Calidad: Mayor Calificación</option>
              </select>
            </div>
          </aside>

          {/* Costume Cards Grid */}
          <main className="lg:col-span-3 space-y-8" id="catalogo-products-section">
            
            {/* Top Bar for Grid Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-xl border border-[#a8001a]/10 shadow-sm gap-4">
              <p className="text-sm font-medium text-[#1e1b18]/80">
                Mostrando <strong className="text-[#a8001a]">{filteredCostumes.length}</strong> de <strong className="text-[#1e1b18]">{COSTUMES.length}</strong> disfraces de carnaval
              </p>
              {selectedCategory !== 'Todos' && (
                <span className="bg-[#a8001a]/10 text-[#a8001a] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                  Categoría: {selectedCategory}
                </span>
              )}
            </div>

            {/* Presupuesto Adaptable Notice Card */}
            <div className="bg-[#a8001a]/5 border border-[#a8001a]/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 text-xs sm:text-sm text-[#1e1b18] leading-relaxed" id="presupuesto-notice-banner">
              <div className="bg-[#a8001a]/10 text-[#a8001a] p-2 rounded-full shrink-0">
                <Sparkles className="h-5 w-5 text-[#fdc003]" />
              </div>
              <div className="space-y-1.5 flex-1">
                <p className="font-bold text-[#a8001a] text-sm font-serif">Alquiler con precios adaptados a tu presupuesto</p>
                <p className="text-[#1e1b18]/75">
                  No publicamos tarifas fijas porque cada experiencia folclórica es única. Conversamos y pactamos el precio de forma personalizada durante tu visita para ajustarnos a tus recursos. <span className="font-semibold text-[#a8001a]">¡Escríbenos por WhatsApp para verificar disponibilidad y agendar tu fitting!</span>
                </p>
              </div>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, vi el catálogo y me gustaría solicitar disponibilidad para agendar una cita de fitting presencial.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.486 1.98 14.007.953 11.39.953c-5.446 0-9.873 4.373-9.877 9.802-.001 1.83.49 3.61 1.42 5.176l-1.02 3.722 3.843-1.002zm12.246-7.394c-.33-.164-1.953-.964-2.253-1.074-.3-.109-.519-.164-.738.164-.219.329-.848 1.074-1.039 1.293-.19.22-.382.247-.712.082-.33-.164-1.393-.513-2.653-1.637-.98-.874-1.642-1.954-1.833-2.283-.19-.33-.02-.508.145-.671.149-.147.33-.384.495-.576.164-.191.219-.329.329-.548.11-.219.055-.411-.028-.576-.082-.164-.738-1.78-.1-2.438-.1-.247-.4-.329-.519-.164-.33-.082-.848-.274-1.177-.055-.329.219-1.286 1.26-1.286 3.07s1.314 3.56 1.496 3.807c.182.247 2.586 3.95 6.263 5.54.875.378 1.56.602 2.09.771.88.279 1.68.239 2.31.145.7-.104 1.953-.8 2.227-1.574.273-.774.273-1.438.191-1.574-.082-.136-.3-.219-.63-.383z"/>
                </svg>
                <span>Agendar por WhatsApp</span>
              </a>
            </div>

            {filteredCostumes.length === 0 ? (
              /* Empty Search / Filters state */
              <div className="bg-white rounded-3xl p-16 text-center border border-[#a8001a]/10 shadow-sm space-y-4">
                <AlertCircle className="h-14 w-14 text-[#a8001a]/40 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-[#1e1b18]">No se encontraron disfraces</h3>
                <p className="text-sm text-[#1e1b18]/60 max-w-md mx-auto">
                  Intenta modificando tus palabras clave de búsqueda o quitando filtros de tallas y categorías para ver toda la colección de Madi.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-[#a8001a] hover:bg-[#920014] text-white font-semibold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              /* Costume Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="costumes-card-grid">
                {filteredCostumes.map((costume) => {
                  const isFav = favorites.includes(costume.id);
                  return (
                    <div
                      key={costume.id}
                      className="bg-white rounded-2xl overflow-hidden border border-[#a8001a]/10 hover:border-[#a8001a]/30 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
                      id={`costume-grid-card-${costume.id}`}
                    >
                      {/* Image section */}
                      <div className="relative h-72 overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={costume.primaryImage}
                          alt={costume.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                          <span className="bg-[#1e1b18] text-[#fff8f5] text-[9px] font-mono tracking-widest font-bold uppercase px-2.5 py-1 rounded-md shadow-sm">
                            {costume.category}
                          </span>
                          {!costume.isAvailable && (
                            <span className="bg-red-600 text-white text-[9px] font-mono tracking-widest font-bold uppercase px-2.5 py-1 rounded-md shadow-sm">
                              Reservado / No Disp.
                            </span>
                          )}
                          {costume.featured && (
                            <span className="bg-[#fdc003] text-[#1e1b18] text-[9px] font-mono tracking-widest font-bold uppercase px-2.5 py-1 rounded-md shadow-sm flex items-center gap-0.5">
                              ★ Alta Gama
                            </span>
                          )}
                        </div>

                        {/* Favorite Wishlist button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(costume.id);
                          }}
                          className="absolute top-3 right-3 bg-[#fff8f5]/95 hover:bg-white p-2 rounded-full shadow-md text-gray-500 hover:text-[#a8001a] active:scale-90 transition-all cursor-pointer"
                          id={`fav-btn-${costume.id}`}
                        >
                          <Heart className={`h-4.5 w-4.5 transition-colors ${isFav ? 'fill-[#a8001a] text-[#a8001a]' : 'text-[#1e1b18]/65'}`} />
                        </button>

                         {/* Custom Price Notice Badge */}
                         <div className="absolute bottom-3 left-3 bg-[#a8001a]/95 text-[#fff8f5] font-serif font-semibold text-[11px] px-3 py-1.5 rounded-lg shadow-md border border-[#fdc003]/20 flex items-center gap-1.5">
                           <Sparkles className="h-3 w-3 text-[#fdc003]" />
                           <span>A tu Presupuesto</span>
                         </div>
                      </div>

                      {/* Info Section */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-[#1e1b18]/50 font-medium">
                            <span className="font-mono">Tallas: {costume.sizes.join(', ')}</span>
                            <div className="flex items-center text-[#fdc003] font-bold">
                              <Star className="h-3.5 w-3.5 fill-[#fdc003] text-[#fdc003] mr-0.5" />
                              <span className="text-[#1e1b18] text-[11px]">{costume.rating}</span>
                              <span className="text-[10px] text-[#1e1b18]/40 ml-0.5">({costume.reviewsCount})</span>
                            </div>
                          </div>
                          <h3 className="font-serif font-bold text-base text-[#1e1b18] group-hover:text-[#a8001a] transition-colors leading-snug">
                            {costume.name}
                          </h3>
                          <p className="text-xs text-[#1e1b18]/65 leading-relaxed line-clamp-3">
                            {costume.description}
                          </p>
                        </div>

                        {/* Actions buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => onNavigate('catalogo-detail', costume.id)}
                            className="flex-1 py-2.5 bg-[#a8001a]/10 hover:bg-[#a8001a] text-[#a8001a] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1 border border-transparent hover:shadow-md cursor-pointer"
                            id={`details-btn-${costume.id}`}
                          >
                            <span>Ver Detalles</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
