import { useEffect, useState } from 'react';
import { Costume, CostumeCategory } from '../types';
import { fetchCostumesFull } from '../services/dataService';

export default function useCostumes(category?: CostumeCategory) {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCostumes() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchCostumesFull(category);
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
  }, [category]);

  return { costumes, isLoading, error };
}
