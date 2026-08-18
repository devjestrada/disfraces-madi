import { useEffect, useState } from 'react';
import { fetchSiteStats } from '../services/dataService';
import { STATS } from '../data';
import { Review, SiteStats } from '../types';

interface HomeData {
  siteStats: SiteStats;
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

// site_stats se muestra en Inicio (contador de años/carnavales): se carga
// aquí en vez de en PublicDataContext para que el resto de rutas (catálogo,
// ficha, servicios, etc.) no disparen esta query.
//
// `reviews` NO se trae por ahora: la sección de testimonios de Inicio.tsx
// está apagada (`{false && (...)}`), así que pedir reviews en cada carga de
// Home era una query desperdiciada (ver
// docs/specs/optimizacion_carga_inicio.spec.md sección 3). `reviews` queda
// fijo en `[]`; reactivar `fetchReviews()` aquí cuando se reactive esa
// sección visual.
export default function useHomeData(): HomeData {
  const [siteStats, setSiteStats] = useState<SiteStats>(STATS);
  const [reviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const statsData = await fetchSiteStats();

        if (!isMounted) return;

        setSiteStats(statsData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  return { siteStats, reviews, isLoading, error };
}
