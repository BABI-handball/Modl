'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/src/types';
import { userStore } from '@/src/lib/userStore';
import { authSupabase } from '@/src/lib/authSupabase';

export const useCurrentUser = (redirectToOnboarding = false) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Marquer comme monté pour éviter les erreurs d'hydratation
    setMounted(true);
    
    // Charger depuis localStorage immédiatement (synchrone)
    const localUser = userStore.getCurrentUser();
    
    if (localUser) {
      // Afficher IMMÉDIATEMENT l'utilisateur local
      setUser(localUser);
      setIsLoading(false);
      
      // Vérifier Supabase en arrière-plan rapidement pour éviter les désynchronisations
      // (ex: ancien utilisateur local différent du compte réellement connecté).
      setTimeout(async () => {
        try {
          const supabaseUser = await authSupabase.getCurrentUser();
          if (supabaseUser) {
            // Si c'est le même utilisateur: refresh des données.
            if (supabaseUser.id === localUser.id) {
              userStore.setCurrentUser(supabaseUser);
              setUser(supabaseUser);
            } else {
              // Si compte différent (cas courant après validation email / changement de compte),
              // on doit basculer sur Supabase pour éviter un profil vide ou incohérent.
              userStore.setCurrentUser(supabaseUser);
              setUser(supabaseUser);
            }
          }
        } catch (error) {
          // Ignorer les erreurs en arrière-plan - on garde l'utilisateur local
        }
      }, 500);
      return;
    }

    // Si pas d'utilisateur local, NE PAS BLOQUER - passer immédiatement
    setIsLoading(false);
    setUser(null);

    // Vérifier Supabase en arrière-plan sans bloquer
    setTimeout(async () => {
      try {
        const timeoutPromise = new Promise<User | null>((resolve) => {
          setTimeout(() => resolve(null), 500);
        });
        const supabasePromise = authSupabase.getCurrentUser();
        const supabaseUser = await Promise.race([supabasePromise, timeoutPromise]);
        
        if (supabaseUser) {
          userStore.setCurrentUser(supabaseUser);
          setUser(supabaseUser);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }, 1000);

    // Pas d'utilisateur trouvé
    if (redirectToOnboarding) {
      setTimeout(() => {
        router.push('/onboarding');
      }, 100);
    }
  }, [redirectToOnboarding, router]);

  // Pendant l'hydratation, retourner un état neutre pour éviter les erreurs
  if (!mounted) {
    return { user: null, isLoading: true };
  }

  return { user, isLoading };
};
