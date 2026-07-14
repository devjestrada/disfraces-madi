import { useEffect, useState } from 'react';
import { Costume } from '../types';
import { fetchCostumesFull } from '../services/dataService';

export default function useCostumes() {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCostumes() {
      try {
        const data = await fetchCostumesFull();
        if (isMounted) {
          setCostumes(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCostumes();
    return () => {
      isMounted = false;
    };
  }, []);

  return { costumes, isLoading, error };
}
