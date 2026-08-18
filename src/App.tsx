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

// Servicios y Nuestra Historia son rutas secundarias (no son la entrada
// más común del sitio, a diferencia de Inicio/Catálogo): se cargan bajo
// demanda para reducir el bundle inicial del sitio público.
const Servicios = lazy(() => import('./views/Servicios'));
const NuestraHistoria = lazy(() => import('./views/NuestraHistoria'));

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const detailMatch = matchPath('/catalogo/:costumeSlug', location.pathname);
  const selectedCostumeSlug = detailMatch?.params.costumeSlug;
  const isCatalogRoute = location.pathname === '/catalogo' || Boolean(detailMatch);
  const categoryParam = new URLSearchParams(location.search).get('categoria') as CatalogCategory | null;
  const activeCatalogCategory =
    isCatalogRoute && categoryParam && categoryParam !== 'Todos' ? categoryParam : undefined;
  // Solo /catalogo y /catalogo/:costumeSlug consumen `costumes` desde aquí;
  // el resto de rutas (Inicio, Servicios, Nuestra Historia, Contacto) no lo
  // necesitan, así que no debe dispararse la query ahí (ver
  // docs/specs/optimizacion_carga_inicio.spec.md sección 2). Inicio.tsx trae
  // su propio listado de disfraces destacados por separado.
  const { costumes, isLoading } = useCostumes(activeCatalogCategory, isCatalogRoute);

  useEffect(() => {
    if (window.location.hash === '#admin') {
      navigate('/admin', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const activeCostume = selectedCostumeSlug
    ? costumes.find((c) => c.slug === selectedCostumeSlug)
    : undefined;

  // Compatibilidad con enlaces antiguos que usaban el uuid en la URL.
  const legacyCostumeMatch =
    !activeCostume && selectedCostumeSlug
      ? costumes.find((c) => c.id === selectedCostumeSlug)
      : undefined;

  useEffect(() => {
    if (legacyCostumeMatch) {
      navigate(`/catalogo/${legacyCostumeMatch.slug}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacyCostumeMatch]);

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
                path="/catalogo/:costumeSlug"
                element={<CatalogoDetail costumeProp={activeCostume} isLoading={isLoading} />}
              />
              <Route
                path="/servicios"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Servicios />
                  </Suspense>
                }
              />
              <Route
                path="/nuestra-historia"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <NuestraHistoria />
                  </Suspense>
                }
              />
              <Route path="/contacto" element={<Contacto />} />
              <Route
                path="/admin"
                element={
                  <Suspense fallback={<RouteLoadingFallback />}>
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

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#fff8f5]" id="route-loading-fallback">
      <div className="h-14 w-14 rounded-full border-4 border-[#a8001a]/20 border-t-[#a8001a] animate-spin" />
    </div>
  );
}
