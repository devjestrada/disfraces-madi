import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { fetchContactInfo } from '../services/dataService';
import { CONTACT_INFO } from '../data';
import { ContactInfo } from '../types';

interface PublicDataContextValue {
  contactInfo: ContactInfo;
  isLoading: boolean;
  error: string | null;
}

const PublicDataContext = createContext<PublicDataContextValue>({
  contactInfo: CONTACT_INFO,
  isLoading: false,
  error: null,
});

// contactInfo (y working_hours) se cargan aquí, de forma global, porque
// Footer y WhatsAppButton los necesitan en TODAS las rutas (se renderizan
// fuera de <Routes>, ver src/App.tsx). siteStats/reviews solo los usa
// Inicio y viven en useHomeData (src/hooks/useHomeData.ts) para no
// dispararlos en rutas que no los consumen (ver
// docs/specs/specs_backlog/optimizacion_rendimiento.spec.md sección 3.1).
export function PublicDataProvider({ children }: PropsWithChildren) {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(CONTACT_INFO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const contactData = await fetchContactInfo();

        if (!isMounted) return;

        setContactInfo(contactData);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPublicData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PublicDataContext.Provider value={{ contactInfo, isLoading, error }}>
      {children}
    </PublicDataContext.Provider>
  );
}

export function usePublicData() {
  return useContext(PublicDataContext);
}
