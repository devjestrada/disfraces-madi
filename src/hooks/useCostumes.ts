import { useEffect, useState } from 'react';
import { Costume, CostumeCategory } from '../types';
import { fetchCostumesFull } from '../services/dataService';

// `enabled` permite que el llamador evite disparar la query cuando su
// resultado no se va a usar (ej. App.tsx solo la necesita en las rutas de
// catálogo/ficha, ver docs/specs/optimizacion_carga_inicio.spec.md sección
// 2, en specs_backlog o specs_done según el estado de la spec). Con
// `enabled: false` el hook no llama a Supabase y expone `costumes: []`.
export default function useCostumes(category?: CostumeCategory, enabled: boolean = true) {
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCostumes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

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
  }, [category, enabled]);

  return { costumes, isLoading, error };
}
