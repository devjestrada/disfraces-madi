import React, { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CatalogCategory, Costume } from '../types';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { usePublicData } from '../context/PublicDataContext';
import { formatCOP } from '../utils/format';
import { useDocumentMeta, useStructuredData } from '../hooks/useSeo';
import { buildBreadcrumbLd } from '../utils/structuredData';

interface CatalogoProps {
  costumes: Costume[];
}

const categoryOptions: CatalogCategory[] =['Todos', 'Cumbia', 'Garabato', 'Mapalé', 'Marimonda', 'Negrita Puloy', 'Congo', 'Monocuco', 'Muerte', 'Fantasía'];
const preferredSizeOrder = ['4', '6', '8', '10', '12', '14', '16', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Catalogo({ costumes }: CatalogoProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = (searchParams.get('categoria') as CatalogCategory) || 'Todos';
  const onCategoryChange = (category: CatalogCategory) => {
    setSearchParams(category === 'Todos' ? {} : { categoria: category });
  };

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const { contactInfo } = usePublicData();

  useDocumentMeta({
    title:
      selectedCategory === 'Todos'
        ? 'Catálogo de Disfraces de Carnaval | Disfraces Madi'
        : `Disfraces de ${selectedCategory} | Disfraces Madi`,
    description:
      selectedCategory === 'Todos'
        ? 'Explora nuestro catálogo de disfraces artesanales del Carnaval de Barranquilla: Cumbia, Garabato, Marimonda y más. Alquiler y venta con precios visibles.'
        : `Alquiler y venta de disfraces de ${selectedCategory} del Carnaval de Barranquilla. Agenda tu visita y prueba tu disfraz antes de confirmar.`,
    path: selectedCategory === 'Todos' ? '/catalogo' : `/catalogo?categoria=${selectedCategory}`,
  });
  useStructuredData(
    'ld-breadcrumb',
    buildBreadcrumbLd(
      selectedCategory === 'Todos'
        ? [
            { name: 'Inicio', path: '/' },
            { name: 'Catálogo', path: '/catalogo' },
          ]
        : [
            { name: 'Inicio', path: '/' },
            { name: 'Catálogo', path: '/catalogo' },
            { name: selectedCategory, path: `/catalogo?categoria=${selectedCategory}` },
          ]
    )
  );

  // Toggle size filter
  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const searchAndCategoryFilteredCostumes = useMemo(() => {
    let result = [...costumes];

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

    if (selectedCategory !== 'Todos') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    return result;
  }, [costumes, searchQuery, selectedCategory]);

  const availableSizePool = useMemo<string[]>(() => {
    const sizes = Array.from(
      new Set(searchAndCategoryFilteredCostumes.flatMap((costume) => costume.sizes))
    ) as string[];

    return sizes.sort((left, right) => {
      const leftIndex = preferredSizeOrder.indexOf(left);
      const rightIndex = preferredSizeOrder.indexOf(right);

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });
  }, [searchAndCategoryFilteredCostumes]);

  useEffect(() => {
    setSelectedSizes((currentSizes) => currentSizes.filter((size) => availableSizePool.includes(size)));
  }, [availableSizePool]);

  // Filtered and Sorted costumes
  const filteredCostumes = useMemo(() => {
    let result = [...searchAndCategoryFilteredCostumes];

    // Sizes
    if (selectedSizes.length > 0) {
      result = result.filter((c) => c.sizes.some((size) => selectedSizes.includes(size)));
    }

    return result;
  }, [searchAndCategoryFilteredCostumes, selectedSizes]);

  const availableSizes = useMemo<string[]>(() => {
    const sizeSource = selectedSizes.length > 0 && filteredCostumes.length > 0
      ? filteredCostumes
      : searchAndCategoryFilteredCostumes;

    const sizes = Array.from(new Set(sizeSource.flatMap((costume) => costume.sizes))) as string[];

    return sizes.sort((left, right) => {
      const leftIndex = preferredSizeOrder.indexOf(left);
      const rightIndex = preferredSizeOrder.indexOf(right);

      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });
  }, [filteredCostumes, searchAndCategoryFilteredCostumes, selectedSizes.length]);

  const childSizes = availableSizes.filter((size) => /^\d+$/.test(size));
  const adultSizes = availableSizes.filter((size) => !/^\d+$/.test(size));

  const handleClearFilters = () => {
    setSearchQuery('');
    onCategoryChange('Todos');
    setSelectedSizes([]);
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
            Encuentra polleras, trajes imperiales de fantasía y disfraces tradicionales restaurados, higienizados y ajustados a tu medida exacta.
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
                Buscar Disfraz
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
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
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
              <div className="space-y-3" id="sizes-filter-grid">
                {childSizes.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#1e1b18]/70 font-semibold font-mono mb-2">Niños</p>
                  <div className="grid grid-cols-4 gap-2">
                    {childSizes.map((size) => {
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
                )}
                {adultSizes.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#1e1b18]/70 font-semibold font-mono mb-2">Adultos</p>
                  <div className="grid grid-cols-5 gap-2">
                    {adultSizes.map((size) => {
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
                )}
              </div>
            </div>
          </aside>

          {/* Costume Cards Grid */}
          <main className="lg:col-span-3 space-y-8" id="catalogo-products-section">
            
            {/* Top Bar for Grid Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-xl border border-[#a8001a]/10 shadow-sm gap-4">
              <p className="text-sm font-medium text-[#1e1b18]/80">
                Mostrando <strong className="text-[#a8001a]">{filteredCostumes.length}</strong> de <strong className="text-[#1e1b18]">{costumes.length}</strong> disfraces de carnaval
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
                <p className="font-bold text-[#a8001a] text-sm font-serif">Precio de referencia, confirmado en tu visita</p>
                <p className="text-[#1e1b18]/75">
                  Los precios de cada disfraz son de referencia. Agenda tu visita de fitting para probarte la pieza y confirmar los detalles finales antes de tu alquiler. <span className="font-semibold text-[#a8001a]">¡Escríbenos por WhatsApp para verificar disponibilidad y agendar tu cita!</span>
                </p>
              </div>
              <a
                href={`https://wa.me/${contactInfo.whatsapp}?text=${encodeURIComponent('Hola Sra. Madi, vi el catálogo y me gustaría solicitar disponibilidad para agendar una cita de fitting presencial.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25d366] hover:bg-[#20ba5a] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <WhatsAppIcon className="h-4 w-4 text-white" />
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
                  return (
                    <div
                      key={costume.id}
                      className="bg-white rounded-2xl overflow-hidden border border-[#a8001a]/10 hover:border-[#a8001a]/30 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
                      id={`costume-grid-card-${costume.id}`}
                    >
                      {/* Image section */}
                      <div className="relative aspect-[4/5] lg:h-72 lg:aspect-auto overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={costume.primaryImage}
                          alt={costume.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                          <span className="bg-[#1e1b18] text-[#fff8f5] text-[9px] font-mono tracking-widest font-bold uppercase px-2.5 py-1 rounded-md shadow-sm">
                            {costume.category}
                          </span>
                          {costume.featured && (
                            <span className="bg-[#fdc003] text-[#1e1b18] text-[9px] font-mono tracking-widest font-bold uppercase px-2.5 py-1 rounded-md shadow-sm flex items-center gap-0.5">
                              ★ Alta Gama
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Section */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs text-[#1e1b18]/50 font-medium font-mono">
                            Tallas: {costume.sizes.join(', ')}
                          </div>
                          <h3 className="font-serif font-bold text-base text-[#1e1b18] group-hover:text-[#a8001a] transition-colors leading-snug">
                            {costume.name}
                          </h3>
                          <p className="text-xs text-[#1e1b18]/65 leading-relaxed line-clamp-3">
                            {costume.description}
                          </p>
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pt-1 font-mono">
                            {costume.rentalPrice ? (
                              <span className="text-sm font-bold text-[#a8001a]">
                                Alquiler: {formatCOP(costume.rentalPrice)}
                              </span>
                            ) : null}
                            {costume.salePrice ? (
                              <span className="text-xs font-semibold text-[#1e1b18]/60">
                                Venta: {formatCOP(costume.salePrice)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/catalogo/${costume.slug}`)}
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
