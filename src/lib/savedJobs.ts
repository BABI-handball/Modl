// Store pour les annonces sauvegardées par les modèles
import { savedJobsStoreSupabase } from './savedJobsSupabase';

const STORAGE_KEY = 'modl_saved_jobs';

export const savedJobsStore = {
  // Récupérer toutes les annonces sauvegardées d'un modèle
  getByModelId: (modelUserId: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Si pas de données locales, charger depuis Supabase en arrière-plan
        setTimeout(async () => {
          try {
            const supabaseJobs = await savedJobsStoreSupabase.getByModelId(modelUserId);
            if (supabaseJobs.length > 0) {
              const savedJobs: Record<string, string[]> = {};
              savedJobs[modelUserId] = supabaseJobs;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
            }
          } catch (error) {
            console.warn('Chargement Supabase des annonces sauvegardées échoué');
          }
        }, 1000);
        return [];
      }
      const savedJobs: Record<string, string[]> = JSON.parse(stored);
      const localJobs = savedJobs[modelUserId] || [];
      
      // Charger depuis Supabase en arrière-plan pour synchroniser
      setTimeout(async () => {
        try {
          const supabaseJobs = await savedJobsStoreSupabase.getByModelId(modelUserId);
          // Fusionner avec les données locales (priorité aux locales)
          const mergedJobs = Array.from(new Set([...localJobs, ...supabaseJobs]));
          if (mergedJobs.length !== localJobs.length || mergedJobs.some(job => !localJobs.includes(job))) {
            savedJobs[modelUserId] = mergedJobs;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
          }
        } catch (error) {
          console.warn('Chargement Supabase des annonces sauvegardées échoué');
        }
      }, 2000);
      
      return localJobs;
    } catch {
      return [];
    }
  },

  // Vérifier si une annonce est sauvegardée
  isSaved: (jobId: string, modelUserId: string): boolean => {
    const savedJobIds = savedJobsStore.getByModelId(modelUserId);
    return savedJobIds.includes(jobId);
  },

  // Sauvegarder une annonce
  save: (jobId: string, modelUserId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const savedJobs: Record<string, string[]> = stored ? JSON.parse(stored) : {};
      
      if (!savedJobs[modelUserId]) {
        savedJobs[modelUserId] = [];
      }
      
      if (!savedJobs[modelUserId].includes(jobId)) {
        savedJobs[modelUserId].push(jobId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
        
        // Sauvegarder dans Supabase en arrière-plan
        savedJobsStoreSupabase.save(jobId, modelUserId)
          .then((success) => {
            if (success) {
              console.log('✅ Annonce sauvegardée dans Supabase');
            }
            // Si success est false, c'est normal pour les annonces mock ou comptes dev
          })
          .catch((error) => {
            // Ne pas logger pour les comptes dev (UUID invalide), erreurs vides, ou violations de clé étrangère (annonces mock)
            const errorMsg = error?.message || String(error);
            const errorCode = error?.code || '';
            
            if (errorMsg && 
                errorMsg !== '{}' && 
                errorMsg !== '[object Object]' &&
                !errorMsg.includes('UUID') && 
                !errorMsg.includes('uuid') &&
                errorCode !== '23503') { // Ne pas logger les violations de clé étrangère (annonces mock)
              console.warn('⚠️ Échec de la sauvegarde Supabase:', error);
            }
          });
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  },

  // Retirer une annonce sauvegardée
  unsave: (jobId: string, modelUserId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      
      const savedJobs: Record<string, string[]> = JSON.parse(stored);
      if (savedJobs[modelUserId]) {
        savedJobs[modelUserId] = savedJobs[modelUserId].filter(id => id !== jobId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
        
        // Retirer de Supabase en arrière-plan
        savedJobsStoreSupabase.unsave(jobId, modelUserId)
          .then((success) => {
            if (success) {
              console.log('✅ Annonce retirée de Supabase');
            }
          })
          .catch((error) => {
            // Ne pas logger pour les comptes dev (UUID invalide)
            const errorMsg = error?.message || String(error);
            if (!errorMsg.includes('UUID') && !errorMsg.includes('uuid')) {
              console.warn('⚠️ Échec de la suppression Supabase:', error);
            }
          });
      }
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  },

  // Toggle sauvegarder/retirer
  toggle: (jobId: string, modelUserId: string): boolean => {
    const isSaved = savedJobsStore.isSaved(jobId, modelUserId);
    if (isSaved) {
      savedJobsStore.unsave(jobId, modelUserId);
      return false;
    } else {
      savedJobsStore.save(jobId, modelUserId);
      return true;
    }
  },
};
