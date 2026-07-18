import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { fetchContactInfo, fetchReviews, fetchSiteStats } from '../services/dataService';
import { CONTACT_INFO, STATS } from '../data';
import { ContactInfo, Review, SiteStats } from '../types';

interface PublicDataContextValue {
  contactInfo: ContactInfo;
  siteStats: SiteStats;
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
}

const PublicDataContext = createContext<PublicDataContextValue>({
  contactInfo: CONTACT_INFO,
  siteStats: STATS,
  reviews: [],
  isLoading: false,
  error: null,
});

export function PublicDataProvider({ children }: PropsWithChildren) {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(CONTACT_INFO);
  const [siteStats, setSiteStats] = useState<SiteStats>(STATS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        const [contactData, statsData, reviewsData] = await Promise.all([
          fetchContactInfo(),
          fetchSiteStats(),
          fetchReviews(),
        ]);

        if (!isMounted) return;

        setContactInfo(contactData);
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

    loadPublicData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PublicDataContext.Provider value={{ contactInfo, siteStats, reviews, isLoading, error }}>
      {children}
    </PublicDataContext.Provider>
  );
}

export function usePublicData() {
  return useContext(PublicDataContext);
}
