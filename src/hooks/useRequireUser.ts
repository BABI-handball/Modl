'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from './useCurrentUser';
import { User } from '@/src/types';
import { userStore } from '@/src/lib/userStore';
import { userProfilesSupabase } from '@/src/lib/userProfilesSupabase';
import { createClient } from '@/src/lib/supabase/client';

/**
 * Hook qui vérifie que l'utilisateur est authentifié et a complété l'onboarding
 * Redirige vers /auth si non connecté, vers /onboarding si profil incomplet (comptes locaux)
 */
export const useRequireUser = (): { user: User; isLoading: boolean } => {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Ne pas bloquer si on charge encore
    if (isLoading) return;
    
    // Éviter les redirections multiples
    if (hasRedirected) return;

    // Si pas d'utilisateur après le chargement, rediriger vers la connexion
    if (!user) {
      setHasRedirected(true);
      setTimeout(() => {
        router.replace('/auth');
      }, 100);
      return;
    }

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    
    // Attendre que le profil soit chargé depuis Supabase avant de vérifier l'onboarding
    // (important pour les comptes Supabase qui n'ont pas encore leur profil en localStorage)
    let profileLoaded = false;
    let checkAttempts = 0;
    const maxAttempts = 20; // 20 tentatives = 2 secondes max

    const ensureEmailConfirmed = async (): Promise<boolean> => {
      // Pour les comptes dev locaux (non-UUID), on ne bloque pas.
      if (!isUuid(user.id)) return true;
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const emailConfirmedAt = data.user?.email_confirmed_at;
        if (!emailConfirmedAt) {
          setHasRedirected(true);
          setTimeout(() => {
            router.replace('/auth?confirmEmail=1');
          }, 100);
          return false;
        }
        return true;
      } catch {
        // En cas d'échec réseau temporaire, ne pas bloquer agressivement l'utilisateur.
        return true;
      }
    };

    const hydrateProfileFromSupabase = async () => {
      if (!isUuid(user.id)) return false;
      try {
        if (user.role === 'MODEL') {
          const profile = await userProfilesSupabase.getModelProfile(user.id);
          if (profile) {
            userStore.setModelProfile(profile);
            return true;
          }
        } else if (user.role === 'PHOTOGRAPHER') {
          const profile = await userProfilesSupabase.getPhotographerProfile(user.id);
          if (profile) {
            userStore.setPhotographerProfile(profile);
            return true;
          }
        } else if (user.role === 'BRAND') {
          const profile = await userProfilesSupabase.getBrandProfile(user.id);
          if (profile) {
            userStore.setBrandProfile(profile);
            return true;
          }
        }

        // Fallback rôle désynchronisé: on tente les 3 profils
        const [modelProfile, photographerProfile, brandProfile] = await Promise.all([
          userProfilesSupabase.getModelProfile(user.id),
          userProfilesSupabase.getPhotographerProfile(user.id),
          userProfilesSupabase.getBrandProfile(user.id),
        ]);

        if (modelProfile) {
          userStore.setModelProfile(modelProfile);
          return true;
        }
        if (photographerProfile) {
          userStore.setPhotographerProfile(photographerProfile);
          return true;
        }
        if (brandProfile) {
          userStore.setBrandProfile(brandProfile);
          return true;
        }
      } catch {
        // no-op
      }
      return false;
    };
    
    const checkOnboarding = async () => {
      checkAttempts++;
      const hasCompletedOnboarding = userStore.hasCompletedOnboarding();
      
      if (hasCompletedOnboarding) {
        // Onboarding complété, ne pas rediriger
        return;
      }
      
      // Si pas encore complété et qu'on n'a pas atteint le max, réessayer
      if (checkAttempts < maxAttempts && !profileLoaded) {
        setTimeout(checkOnboarding, 100); // Réessayer après 100ms
      } else if (checkAttempts >= maxAttempts || profileLoaded) {
        // Après 2 secondes OU si le profil est chargé, vérifier une dernière fois
        let finalCheck = userStore.hasCompletedOnboarding();
        if (!finalCheck) {
          const hydrated = await hydrateProfileFromSupabase();
          if (hydrated) {
            finalCheck = userStore.hasCompletedOnboarding();
          }
        }
        if (!finalCheck) {
          // Pour les comptes Supabase réels, on évite la redirection forcée en boucle
          // vers l'onboarding. L'utilisateur pourra compléter depuis son profil si besoin.
          if (isUuid(user.id)) {
            return;
          }
          // Rediriger vers onboarding seulement si vraiment pas complété
          setHasRedirected(true);
          setTimeout(() => {
            router.replace('/onboarding');
          }, 100);
        }
      }
    };
    
    // Écouter l'événement de chargement de profil depuis Supabase
    const handleProfileLoaded = (event: CustomEvent) => {
      if (event.detail?.userId === user.id) {
        profileLoaded = true;
        // Vérifier immédiatement après le chargement du profil
        setTimeout(checkOnboarding, 50);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('profileLoaded', handleProfileLoaded as EventListener);
    }
    
    // Commencer la vérification après un court délai
    setTimeout(async () => {
      const emailIsConfirmed = await ensureEmailConfirmed();
      if (!emailIsConfirmed) return;
      checkOnboarding();
    }, 200);
    
    // Nettoyer l'écouteur
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profileLoaded', handleProfileLoaded as EventListener);
      }
    };
  }, [user, isLoading, router, hasRedirected]);

  // Si pas d'utilisateur, retourner isLoading seulement si on n'a pas encore redirigé
  if (!user) {
    return { user: null as any, isLoading: hasRedirected ? false : isLoading };
  }

  return { user, isLoading };
};
