import { useEffect, useState } from 'react';
import { fetchReviews, fetchSiteStats } from '../services/dataService';
import { STATS } from '../data';
import { Review, SiteStats } from '../types';

interface HomeData {
  siteStats: SiteStats;
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

// site_stats y reviews solo se muestran en Inicio (contador de años/carnavales
// y testimonios): se cargan aquí en vez de en PublicDataContext para que el
// resto de rutas (catálogo, ficha, servicios, etc.) no disparen estas queries.
export default function useHomeData(): HomeData {
  const [siteStats, setSiteStats] = useState<SiteStats>(STATS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        const [statsData, reviewsData] = await Promise.all([fetchSiteStats(), fetchReviews()]);

        if (!isMounted) return;

        setSiteStats(statsData);
        setReviews(reviewsData);
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
