import { JobPost } from '@/src/types';
import { jobsStoreSupabase } from './jobsSupabase';

// Store local pour les annonces (mock)
const STORAGE_KEY = 'modl_jobs';
const MESSAGES_STORAGE_KEY = 'modl_messages_v2';
const THREADS_STORAGE_KEY = 'modl_threads_v2';
const MAX_IMAGE_DATA_URL_LENGTH = 220_000;

const compactJobsForStorage = (jobs: JobPost[]): JobPost[] =>
  jobs.map((job) => ({
    ...job,
    referenceImages: (job.referenceImages || []).filter((img) => {
      if (typeof img !== 'string') return false;
      if (!img.startsWith('data:')) return true;
      return img.length <= MAX_IMAGE_DATA_URL_LENGTH;
    }),
  }));

const persistJobs = (jobs: JobPost[]): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    return true;
  } catch (error) {
    // Le plus gros volume vient souvent des messages/attachments.
    // On purge ce cache pour liberer de l'espace, puis on retente.
    try {
      localStorage.removeItem(MESSAGES_STORAGE_KEY);
      localStorage.removeItem(THREADS_STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      console.warn('⚠️ Espace local saturé: cache messages purgé pour sauvegarder les annonces.');
      return true;
    } catch (retryError) {
      try {
        const compactJobs = compactJobsForStorage(jobs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compactJobs));
        console.warn('⚠️ Annonce sauvegardée en mode allégé (images trop lourdes retirées localement).');
        return true;
      } catch (compactError) {
        console.error('Error saving job:', compactError);
        return false;
      }
    }
  }
};

// Helper pour convertir les dates string en Date objects
const parseJobDates = (job: any): JobPost => {
  return {
    ...job,
    date: job.date instanceof Date ? job.date : new Date(job.date),
    createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
    boostUntil: job.boostUntil ? (job.boostUntil instanceof Date ? job.boostUntil : new Date(job.boostUntil)) : undefined,
  };
};

export const jobsStore = {
  // Récupérer toutes les annonces (mock + créées)
  getAll: (): JobPost[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const jobs = stored ? JSON.parse(stored) : [];
      return jobs.map(parseJobDates);
    } catch {
      return [];
    }
  },

  // Ajouter une annonce
  add: (job: JobPost): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const jobs = jobsStore.getAll();
      // Vérifier si l'annonce existe déjà
      const exists = jobs.some((j) => j.id === job.id);
      if (!exists) {
        jobs.push(job);
        return persistJobs(jobs);
      }
      return true;
    } catch (error) {
      console.error('Error preparing job save:', error);
      return false;
    }
  },

  // Récupérer les annonces d'un utilisateur
  getByOwnerId: (ownerUserId: string): JobPost[] => {
    const jobs = jobsStore.getAll();
    return jobs.filter((job) => job.ownerUserId === ownerUserId);
  },

  // Supprimer une annonce
  delete: (jobId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const jobs = jobsStore.getAll();
      const filtered = jobs.filter((j) => j.id !== jobId);
      persistJobs(filtered);
      
      // Supprimer de Supabase en arrière-plan
      jobsStoreSupabase.delete(jobId)
        .then((success) => {
          if (success) {
            console.log('✅ Annonce supprimée de Supabase');
          }
        })
        .catch((error) => {
          // Ne pas logger pour les comptes dev (UUID invalide) ou erreurs vides
          const errorMsg = error?.message || String(error);
          if (errorMsg && 
              errorMsg !== '{}' && 
              errorMsg !== '[object Object]' &&
              !errorMsg.includes('UUID') && 
              !errorMsg.includes('uuid')) {
            console.warn('⚠️ Échec de la suppression Supabase:', error);
          }
        });
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  },

  // Mettre à jour une annonce
  update: (jobId: string, updates: Partial<JobPost>): void => {
    if (typeof window === 'undefined') return;
    try {
      const jobs = jobsStore.getAll();
      const index = jobs.findIndex((j) => j.id === jobId);
      if (index !== -1) {
        jobs[index] = { ...jobs[index], ...updates };
        persistJobs(jobs);
        
        // Mettre à jour dans Supabase en arrière-plan
        jobsStoreSupabase.update(jobId, updates)
          .then((success) => {
            if (success) {
              console.log('✅ Annonce mise à jour dans Supabase');
            }
          })
          .catch((error) => {
            // Ne pas logger pour les comptes dev (UUID invalide) ou erreurs vides
            const errorMsg = error?.message || String(error);
            if (errorMsg && 
                errorMsg !== '{}' && 
                errorMsg !== '[object Object]' &&
                !errorMsg.includes('UUID') && 
                !errorMsg.includes('uuid')) {
              console.warn('⚠️ Échec de la mise à jour Supabase:', error);
            }
          });
      }
    } catch (error) {
      console.error('Error updating job:', error);
    }
  },

  // Nettoyer les annonces inappropriées
  cleanInappropriate: (): void => {
    if (typeof window === 'undefined') return;
    try {
      const jobs = jobsStore.getAll();
      const inappropriateTerms = ['pipi', 'caca'];
      const cleaned = jobs.filter((job) => {
        const title = job.title.toLowerCase();
        const description = job.description.toLowerCase();
        return !inappropriateTerms.some((term) => title.includes(term) || description.includes(term));
      });
      
      if (cleaned.length !== jobs.length) {
        persistJobs(cleaned);
      }
    } catch (error) {
      console.error('Error cleaning jobs:', error);
    }
  },
};
