import React, { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, matchPath, useLocation, useNavigate } from 'react-router-dom';

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
import NotFound from './views/NotFound';

// Helpers and types
import useCostumes from './hooks/useCostumes';
import { PublicDataProvider } from './context/PublicDataContext';
import type { CatalogCategory } from './types';

// El panel admin se carga solo cuando alguien visita /admin, para no
// incluir su código (login, CRUD de disfraces, subida de imágenes) en
// el bundle público inicial.
const Admin = lazy(() => import('./views/Admin'));

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const detailMatch = matchPath('/catalogo/:costumeId', location.pathname);
  const selectedCostumeId = detailMatch?.params.costumeId;
  const isCatalogRoute = location.pathname === '/catalogo' || Boolean(detailMatch);
  const categoryParam = new URLSearchParams(location.search).get('categoria') as CatalogCategory | null;
  const activeCatalogCategory =
    isCatalogRoute && categoryParam && categoryParam !== 'Todos' ? categoryParam : undefined;
  const { costumes, isLoading } = useCostumes(activeCatalogCategory);

  useEffect(() => {
    if (window.location.hash === '#admin') {
      navigate('/admin', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const activeCostume = selectedCostumeId
    ? costumes.find((c) => c.id === selectedCostumeId)
    : undefined;
  const activeCostumeForWhatsApp = activeCostume?.name;

  return (
    <PublicDataProvider>
      <div className="flex flex-col min-h-screen bg-[#fff8f5]" id="app-root-layout">
        <Navbar />

        <main className="flex-grow" id="main-content-flow">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            id="view-transition-wrapper"
          >
            <Routes location={location}>
              <Route path="/" element={<Inicio />} />
              <Route path="/catalogo" element={<Catalogo costumes={costumes} />} />
              <Route
                path="/catalogo/:costumeId"
                element={<CatalogoDetail costumeProp={activeCostume} isLoading={isLoading} />}
              />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/nuestra-historia" element={<NuestraHistoria />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <Admin />
                  </Suspense>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <WhatsAppButton selectedCostumeName={activeCostumeForWhatsApp} />
    </div>
    </PublicDataProvider>
  );
}

function AdminLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#fff8f5]" id="admin-loading-fallback">
      <div className="h-14 w-14 rounded-full border-4 border-[#a8001a]/20 border-t-[#a8001a] animate-spin" />
    </div>
  );
}
