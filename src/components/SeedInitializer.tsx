'use client';

import { useEffect } from 'react';
import { seedDemoData } from '@/src/lib/seed';

/**
 * Composant qui initialise les données de seed au chargement de l'app
 */
export const SeedInitializer = () => {
  useEffect(() => {
    seedDemoData();
  }, []);

  return null;
};
