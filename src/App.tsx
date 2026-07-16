import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Common Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

// Screen Views
import Inicio from './views/Inicio';
import Catalogo from './views/Catalogo';
import CatalogoDetail from './views/CatalogoDetail';
import Servicios from './views/Servicios';
import NuestraHistoria from './views/NuestraHistoria';
import Contacto from './views/Contacto';

// Helpers and types
import useCostumes from './hooks/useCostumes';
import { PublicDataProvider } from './context/PublicDataContext';
import type { CatalogCategory } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('inicio');
  const [selectedCostumeId, setSelectedCostumeId] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [catalogCategory, setCatalogCategory] = useState<CatalogCategory>('Todos');
  const activeCatalogCategory =
    (currentView === 'catalogo' || currentView === 'catalogo-detail') && catalogCategory !== 'Todos'
      ? catalogCategory
      : undefined;
  const { costumes } = useCostumes(activeCatalogCategory);

  useEffect(() => {
    const savedFavs = localStorage.getItem('madi_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Error loading favorites', e);
      }
    }
  }, []);

  const handleNavigate = (viewId: string, costumeId?: string, category?: CatalogCategory) => {
    setCurrentView(viewId);

    if (viewId === 'catalogo' && category) {
      setCatalogCategory(category);
    } else if (viewId !== 'catalogo-detail') {
      setCatalogCategory('Todos');
    }

    if (costumeId) {
      setSelectedCostumeId(costumeId);
    } else {
      setSelectedCostumeId('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter((favId) => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('madi_favorites', JSON.stringify(updated));
  };

  const activeCostume = selectedCostumeId
    ? costumes.find((c) => c.id === selectedCostumeId)
    : undefined;
  const activeCostumeForWhatsApp = activeCostume?.name;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'inicio':
        return (
          <Inicio
            onNavigate={handleNavigate}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        );
      case 'catalogo':
        return (
          <Catalogo
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            costumes={costumes}
            selectedCategory={catalogCategory}
            onCategoryChange={setCatalogCategory}
          />
        );
      case 'catalogo-detail':
        return (
          <CatalogoDetail
            costumeProp={activeCostume}
            costumeId={selectedCostumeId}
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        );
      case 'servicios':
        return <Servicios onNavigate={handleNavigate} />;
      case 'historia':
        return <NuestraHistoria onNavigate={handleNavigate} />;
      case 'contacto':
        return <Contacto />;
      default:
        return (
          <Inicio
            onNavigate={handleNavigate}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        );
    }
  };

  return (
    <PublicDataProvider>
      <div className="flex flex-col min-h-screen bg-[#fff8f5]" id="app-root-layout">
        <Navbar
          currentView={currentView}
          onNavigate={handleNavigate}
          favoritesCount={favorites.length}
        />

        <main className="flex-grow" id="main-content-flow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (selectedCostumeId || '')}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            id="view-transition-wrapper"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onNavigate={handleNavigate} />

      <WhatsAppButton selectedCostumeName={activeCostumeForWhatsApp} />
    </div>
    </PublicDataProvider>
  );
}
