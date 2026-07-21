'use client';

import { User, UserRole, ModelProfile, PhotographerProfile, BrandProfile } from '@/src/types';
import { mockModelProfiles, mockBrandProfiles, mockPhotographerProfiles } from '@/src/data/mock';
import { userProfilesSupabase } from './userProfilesSupabase';

const USER_STORAGE_KEY = 'modl_user';
const MODEL_PROFILE_STORAGE_KEY = 'modl_model_profiles';
const PHOTOGRAPHER_PROFILE_STORAGE_KEY = 'modl_photographer_profiles';
const BRAND_PROFILE_STORAGE_KEY = 'modl_brand_profiles';
const MESSAGES_STORAGE_KEY = 'modl_messages_v2';
const THREADS_STORAGE_KEY = 'modl_threads_v2';
const MAX_INLINE_IMAGE_LENGTH = 180_000;
const ONBOARDING_DONE_PREFIX = 'modl_onboarding_done_';

let currentUser: User | null = null;
let modelProfiles: ModelProfile[] = [];
let photographerProfiles: PhotographerProfile[] = [];
let brandProfiles: BrandProfile[] = [];

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const safeSetLocalStorage = (key: string, value: unknown): boolean => {
  if (typeof window === 'undefined') return false;
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    try {
      // Libérer d'abord les caches les plus volumineux
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
      localStorage.removeItem(THREADS_STORAGE_KEY);
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
};

const compactInlineImage = (value?: string): string | undefined => {
  if (!value) return value;
  if (value.startsWith('data:') && value.length > MAX_INLINE_IMAGE_LENGTH) {
    return undefined;
  }
  return value;
};

// Hydrate depuis localStorage
const hydrateFromStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
    }
    
    const storedModels = localStorage.getItem(MODEL_PROFILE_STORAGE_KEY);
    if (storedModels) {
      modelProfiles = JSON.parse(storedModels);
    }
    
    const storedPhotographers = localStorage.getItem(PHOTOGRAPHER_PROFILE_STORAGE_KEY);
    if (storedPhotographers) {
      photographerProfiles = JSON.parse(storedPhotographers);
    }
    
    const storedBrands = localStorage.getItem(BRAND_PROFILE_STORAGE_KEY);
    if (storedBrands) {
      brandProfiles = JSON.parse(storedBrands);
    }
  } catch (error) {
    console.error('Error hydrating from storage:', error);
  }
};

// Initialiser au chargement
if (typeof window !== 'undefined') {
  hydrateFromStorage();
}

export const userStore = {
  // User
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    if (!currentUser) {
      hydrateFromStorage();
    }
    return currentUser;
  },

  setCurrentUser: (user: User): void => {
    currentUser = user;
    if (typeof window !== 'undefined') {
      // Eviter d'écrire un avatar inline trop lourd dans la clé utilisateur
      const persistedUser: User = {
        ...user,
        avatarUrl: compactInlineImage(user.avatarUrl),
      };
      safeSetLocalStorage(USER_STORAGE_KEY, persistedUser);
      // Synchroniser aussi avec auth
      safeSetLocalStorage('modl_user', persistedUser);
    }
  },

  // Model Profile
  getModelProfile: (userId: string): ModelProfile | null => {
    if (typeof window === 'undefined') return null;
    if (modelProfiles.length === 0) {
      hydrateFromStorage();
    }
    const profileFromStore = modelProfiles.find(p => p.userId === userId);
    if (profileFromStore) {
      // Ne jamais écraser les données existantes, seulement ajouter les propriétés manquantes depuis mock
      const mockProfile = mockModelProfiles.find(p => p.userId === userId);
      if (mockProfile) {
        let needsUpdate = false;
        const updatedProfile = { ...profileFromStore };
        
        // Ajouter seulement les propriétés manquantes, sans écraser les existantes
        if (!updatedProfile.bust && mockProfile.bust) {
          updatedProfile.bust = mockProfile.bust;
          needsUpdate = true;
        }
        if (!updatedProfile.waist && mockProfile.waist) {
          updatedProfile.waist = mockProfile.waist;
          needsUpdate = true;
        }
        if (!updatedProfile.hips && mockProfile.hips) {
          updatedProfile.hips = mockProfile.hips;
          needsUpdate = true;
        }
        if (!updatedProfile.shoeSize && mockProfile.shoeSize) {
          updatedProfile.shoeSize = mockProfile.shoeSize;
          needsUpdate = true;
        }
        if (!updatedProfile.dressSize && mockProfile.dressSize) {
          updatedProfile.dressSize = mockProfile.dressSize;
          needsUpdate = true;
        }
        if (!updatedProfile.armCircumference && mockProfile.armCircumference) {
          updatedProfile.armCircumference = mockProfile.armCircumference;
          needsUpdate = true;
        }
        if (!updatedProfile.hairLength && mockProfile.hairLength) {
          updatedProfile.hairLength = mockProfile.hairLength;
          needsUpdate = true;
        }
        if (!updatedProfile.skinTone && mockProfile.skinTone) {
          updatedProfile.skinTone = mockProfile.skinTone;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          userStore.setModelProfile(updatedProfile);
          return updatedProfile;
        }
      }
      
      // Vérifier Supabase en arrière-plan pour synchroniser (sans bloquer)
      setTimeout(async () => {
        try {
          const supabaseProfile = await userProfilesSupabase.getModelProfile(userId);
          if (supabaseProfile && supabaseProfile.userId === profileFromStore.userId) {
            // Mettre à jour seulement si différent
            const needsSync = JSON.stringify(supabaseProfile) !== JSON.stringify(profileFromStore);
            if (needsSync) {
              userStore.setModelProfile(supabaseProfile);
            }
          }
        } catch (error) {
          // Ignorer les erreurs en arrière-plan
        }
      }, 2000);
      
      return profileFromStore;
    }
    
    // Si pas dans localStorage, vérifier Supabase en arrière-plan (sans bloquer)
    setTimeout(async () => {
      try {
        const supabaseProfile = await userProfilesSupabase.getModelProfile(userId);
        if (supabaseProfile) {
          userStore.setModelProfile(supabaseProfile);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }, 1000);
    
    // Fallback sur les données mock
    return mockModelProfiles.find(p => p.userId === userId) || null;
  },

  setModelProfile: (profile: ModelProfile): void => {
    hydrateFromStorage();
    const index = modelProfiles.findIndex(p => p.userId === profile.userId);
    if (index !== -1) {
      modelProfiles[index] = profile;
    } else {
      modelProfiles.push(profile);
    }
    if (typeof window !== 'undefined') {
      safeSetLocalStorage(MODEL_PROFILE_STORAGE_KEY, modelProfiles);
    }
    
    // Ne pas tenter une synchro distante pour les comptes non-Supabase.
    if (!isUuid(profile.userId)) {
      return;
    }

    // Eviter les erreurs parasites juste après validation email: on sync
    // seulement si la session locale correspond à ce profil.
    if (currentUser?.id && currentUser.id !== profile.userId) {
      return;
    }

    // Sauvegarder dans Supabase en arrière-plan (sans bloquer)
    userProfilesSupabase.setModelProfile(profile).catch((error) => {
      console.warn('Échec de la sauvegarde Supabase du profil modèle:', error);
    });
  },

  // Photographer Profile
  getPhotographerProfile: (userId: string): PhotographerProfile | null => {
    if (typeof window === 'undefined') return null;
    if (photographerProfiles.length === 0) {
      hydrateFromStorage();
    }
    const profileFromStore = photographerProfiles.find(p => p.userId === userId);
    if (profileFromStore) {
      // Vérifier Supabase en arrière-plan pour synchroniser (sans bloquer)
      setTimeout(async () => {
        try {
          const supabaseProfile = await userProfilesSupabase.getPhotographerProfile(userId);
          if (supabaseProfile && supabaseProfile.userId === profileFromStore.userId) {
            const needsSync = JSON.stringify(supabaseProfile) !== JSON.stringify(profileFromStore);
            if (needsSync) {
              userStore.setPhotographerProfile(supabaseProfile);
            }
          }
        } catch (error) {
          // Ignorer les erreurs en arrière-plan
        }
      }, 2000);
      return profileFromStore;
    }
    
    // Si pas dans localStorage, vérifier Supabase en arrière-plan (sans bloquer)
    setTimeout(async () => {
      try {
        const supabaseProfile = await userProfilesSupabase.getPhotographerProfile(userId);
        if (supabaseProfile) {
          userStore.setPhotographerProfile(supabaseProfile);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }, 1000);
    
    // Fallback sur les données mock
    return mockPhotographerProfiles.find(p => p.userId === userId) || null;
  },

  setPhotographerProfile: (profile: PhotographerProfile): void => {
    hydrateFromStorage();
    const index = photographerProfiles.findIndex(p => p.userId === profile.userId);
    if (index !== -1) {
      photographerProfiles[index] = profile;
    } else {
      photographerProfiles.push(profile);
    }
    if (typeof window !== 'undefined') {
      safeSetLocalStorage(PHOTOGRAPHER_PROFILE_STORAGE_KEY, photographerProfiles);
    }
    
    if (!isUuid(profile.userId)) {
      return;
    }

    if (currentUser?.id && currentUser.id !== profile.userId) {
      return;
    }

    // Sauvegarder dans Supabase en arrière-plan (sans bloquer)
    userProfilesSupabase.setPhotographerProfile(profile).catch((error) => {
      console.warn('Échec de la sauvegarde Supabase du profil photographe:', error);
    });
  },

  // Brand Profile
  getBrandProfile: (userId: string): BrandProfile | null => {
    if (typeof window === 'undefined') return null;
    if (brandProfiles.length === 0) {
      hydrateFromStorage();
    }
    const profileFromStore = brandProfiles.find(p => p.userId === userId);
    if (profileFromStore) {
      // Vérifier Supabase en arrière-plan pour synchroniser (sans bloquer)
      setTimeout(async () => {
        try {
          const supabaseProfile = await userProfilesSupabase.getBrandProfile(userId);
          if (supabaseProfile && supabaseProfile.userId === profileFromStore.userId) {
            const needsSync = JSON.stringify(supabaseProfile) !== JSON.stringify(profileFromStore);
            if (needsSync) {
              userStore.setBrandProfile(supabaseProfile);
            }
          }
        } catch (error) {
          // Ignorer les erreurs en arrière-plan
        }
      }, 2000);
      return profileFromStore;
    }
    
    // Si pas dans localStorage, essayer de charger depuis Supabase immédiatement
    // mais seulement si c'est un UUID (compte Supabase), pas un compte dev
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (isUUID) {
      // Charger depuis Supabase immédiatement (sans délai)
      // Utiliser une promesse pour permettre l'attente
      (async () => {
        try {
          const supabaseProfile = await userProfilesSupabase.getBrandProfile(userId);
          if (supabaseProfile) {
            userStore.setBrandProfile(supabaseProfile);
            // Déclencher un événement pour notifier que le profil est chargé
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId, role: 'BRAND' } }));
            }
          } else {
            // Pas de profil dans Supabase, déclencher quand même l'événement pour éviter l'attente infinie
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId, role: 'BRAND', notFound: true } }));
            }
          }
        } catch (error) {
          // En cas d'erreur, déclencher quand même l'événement pour éviter l'attente infinie
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId, role: 'BRAND', error: true } }));
          }
        }
      })();
    }
    
    // Fallback sur les données mock
    return mockBrandProfiles.find(p => p.userId === userId) || null;
  },

  setBrandProfile: (profile: BrandProfile): void => {
    hydrateFromStorage();
    const index = brandProfiles.findIndex(p => p.userId === profile.userId);
    if (index !== -1) {
      brandProfiles[index] = profile;
    } else {
      brandProfiles.push(profile);
    }
    if (typeof window !== 'undefined') {
      safeSetLocalStorage(BRAND_PROFILE_STORAGE_KEY, brandProfiles);
    }

    // Ne pas tenter de sauvegarder dans Supabase pour les comptes de démo / mock
    if (!isUuid(profile.userId)) {
      return;
    }

    // Sauvegarder dans Supabase en arrière-plan (sans bloquer)
    userProfilesSupabase.setBrandProfile(profile).catch(() => {
      // On ignore les erreurs Supabase ici pour éviter le bruit en console côté UI
    });
  },

  // Update profile (générique selon le rôle)
  updateProfile: (userId: string, role: UserRole, profileData: Partial<ModelProfile | PhotographerProfile | BrandProfile>): void => {
    if (role === 'MODEL') {
      const existing = userStore.getModelProfile(userId);
      if (existing) {
        userStore.setModelProfile({ ...existing, ...profileData } as ModelProfile);
      }
    } else if (role === 'PHOTOGRAPHER') {
      const existing = userStore.getPhotographerProfile(userId);
      if (existing) {
        userStore.setPhotographerProfile({ ...existing, ...profileData } as PhotographerProfile);
      }
    } else if (role === 'BRAND') {
      const existing = userStore.getBrandProfile(userId);
      if (existing) {
        userStore.setBrandProfile({ ...existing, ...profileData } as BrandProfile);
      }
    }
  },

  // Logout
  logout: (): void => {
    currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('modl_user');
    }
  },

  // Check if user has completed onboarding
  hasCompletedOnboarding: (): boolean => {
    const user = userStore.getCurrentUser();
    if (!user) return false;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

    // Flag explicite: posé à la fin de l'onboarding pour éviter les races de synchro.
    if (typeof window !== 'undefined') {
      const doneFlag = localStorage.getItem(`${ONBOARDING_DONE_PREFIX}${user.id}`);
      if (doneFlag === '1') return true;
    }
    
    // Pour les comptes de développement (dev-*), considérer l'onboarding comme complété
    // car ils sont créés avec des profils complets
    if (user.id.startsWith('dev-') || user.id.startsWith('user-')) {
      // Vérifier quand même que le profil existe
      if (user.role === 'MODEL') {
        const profile = userStore.getModelProfile(user.id);
        return profile !== null;
      } else if (user.role === 'PHOTOGRAPHER') {
        const profile = userStore.getPhotographerProfile(user.id);
        return profile !== null;
      } else if (user.role === 'BRAND') {
        const profile = userStore.getBrandProfile(user.id);
        return profile !== null;
      }
    }
    
    // Pour les comptes réels Supabase (UUID), la présence d'un profil suffit.
    // Les champs peuvent être partiels selon les migrations/versions, mais cela ne doit pas
    // renvoyer en boucle vers l'onboarding.
    if (isUuid) {
      if (user.role === 'MODEL') return userStore.getModelProfile(user.id) !== null;
      if (user.role === 'PHOTOGRAPHER') return userStore.getPhotographerProfile(user.id) !== null;
      if (user.role === 'BRAND') return userStore.getBrandProfile(user.id) !== null;
    }

    if (user.role === 'MODEL') {
      const profile = userStore.getModelProfile(user.id);
      return profile !== null && profile.portfolioImages && profile.portfolioImages.length > 0 && !!profile.height && !!profile.weight;
    } else if (user.role === 'PHOTOGRAPHER') {
      const profile = userStore.getPhotographerProfile(user.id);
      return profile !== null && profile.portfolioImages && profile.portfolioImages.length > 0;
    } else if (user.role === 'BRAND') {
      const profile = userStore.getBrandProfile(user.id);
      return profile !== null && !!profile.companyName;
    }
    
    return false;
  },
};
