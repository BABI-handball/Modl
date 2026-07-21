import { Application } from '@/src/types';
import { mockJobPosts, mockApplications } from '@/src/data/mock';
import { jobsStore } from './jobs';
import { applicationsStoreSupabase } from './applicationsSupabase';

// Store local pour les candidatures (mock)
const STORAGE_KEY = 'modl_applications';

export const applicationsStore = {
  // Récupérer toutes les candidatures
  getAll: (): Application[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Ajouter une candidature
  add: (application: Application): void => {
    if (typeof window === 'undefined') return;
    try {
      const applications = applicationsStore.getAll();
      // Vérifier si la candidature existe déjà
      const exists = applications.some(
        (app) => app.jobId === application.jobId && app.modelUserId === application.modelUserId
      );
      if (!exists) {
        applications.push(application);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
        
        // Sauvegarder dans Supabase en arrière-plan (sans bloquer)
        applicationsStoreSupabase.add(application).then((result) => {
          if (result) {
            console.log('✅ Candidature synchronisée avec Supabase');
          } else {
            console.warn('⚠️ La candidature n\'a pas pu être synchronisée avec Supabase (peut-être un compte dev)');
          }
        }).catch((error) => {
          console.error('❌ Erreur lors de la synchronisation Supabase:', error);
        });
      }
    } catch (error) {
      console.error('Error saving application:', error);
    }
  },

  // Vérifier si un modèle a déjà postulé
  hasApplied: (jobId: string, modelUserId: string): boolean => {
    const storedApplications = applicationsStore.getAll();
    const isDevUser = modelUserId.startsWith('dev-') || modelUserId.startsWith('user-');
    const allApplications = isDevUser ? [...mockApplications, ...storedApplications] : storedApplications;
    return allApplications.some(
      (app) => app.jobId === jobId && app.modelUserId === modelUserId
    );
  },

  // Récupérer les candidatures pour un job
  getByJobId: (jobId: string): Application[] => {
    const applications = applicationsStore.getAll();
    return applications.filter((app) => app.jobId === jobId);
  },

  // Récupérer les candidatures d'un modèle
  getByModelId: (modelUserId: string): Application[] => {
    const applications = applicationsStore.getAll();
    const isDevUser = modelUserId.startsWith('dev-') || modelUserId.startsWith('user-');
    const mockApps = isDevUser ? mockApplications.filter((app) => app.modelUserId === modelUserId) : [];
    const storedApps = applications.filter((app) => app.modelUserId === modelUserId);
    // Combiner mock et stored, en priorisant stored pour éviter les doublons
    const allApps = [...mockApps, ...storedApps];
    // Supprimer les doublons basés sur l'ID
    const uniqueApps = allApps.filter((app, index, self) => 
      index === self.findIndex((a) => a.id === app.id)
    );
    return uniqueApps;
  },

  // Supprimer une candidature
  delete: (applicationId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const applications = applicationsStore.getAll();
      const filtered = applications.filter((app) => app.id !== applicationId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      // Supprimer de Supabase en arrière-plan
      applicationsStoreSupabase.delete(applicationId)
        .then((success) => {
          if (success) {
            console.log('✅ Candidature supprimée de Supabase');
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
      console.error('Error deleting application:', error);
    }
  },

  // Compter les candidatures en attente pour un utilisateur (marque/photographe)
  getPendingCount: (userId: string): number => {
    if (typeof window === 'undefined') return 0;
    
    // Récupérer tous les jobs (mock + créés)
    const createdJobs = jobsStore.getAll();
    const allJobs = [...mockJobPosts, ...createdJobs];
    
    // Filtrer les jobs de l'utilisateur
    const userJobs = allJobs.filter((job) => job.ownerUserId === userId);
    const userJobIds = userJobs.map((job) => job.id);
    
    // Récupérer toutes les candidatures (mock + créées)
    const storedApplications = applicationsStore.getAll();
    const allApplications = [...mockApplications, ...storedApplications];
    
    // Filtrer les candidatures PENDING pour les jobs de l'utilisateur
    const pendingApps = allApplications.filter(
      (app) => app.status === 'PENDING' && userJobIds.includes(app.jobId)
    );
    
    return pendingApps.length;
  },

  // Marquer une candidature comme sélectionnée (après swipe right)
  markAsSelected: (applicationId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const applications = applicationsStore.getAll();
      const selectedAt = new Date();
      const updated = applications.map((app) => 
        app.id === applicationId 
          ? { ...app, status: 'SELECTED' as const, selectedAt }
          : app
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Mettre à jour dans Supabase en arrière-plan avec selectedAt
      applicationsStoreSupabase.updateStatus(applicationId, 'SELECTED', selectedAt).catch((error) => {
        console.warn('Échec de la mise à jour Supabase de la candidature:', error);
      });
    } catch (error) {
      console.error('Error marking application as selected:', error);
    }
  },

  // Récupérer les candidatures sélectionnées pour les jobs d'un utilisateur
  getSelectedByOwnerId: (userId: string): Application[] => {
    if (typeof window === 'undefined') return [];
    
    // Récupérer tous les jobs de l'utilisateur
    const createdJobs = jobsStore.getAll();
    const allJobs = [...mockJobPosts, ...createdJobs];
    const userJobIds = allJobs
      .filter((job) => job.ownerUserId === userId)
      .map((job) => job.id);
    
    // Récupérer toutes les candidatures
    const storedApplications = applicationsStore.getAll();
    const allApplications = [...mockApplications, ...storedApplications];
    
    // Filtrer les candidatures SELECTED pour les jobs de l'utilisateur
    return allApplications.filter(
      (app) => app.status === 'SELECTED' && userJobIds.includes(app.jobId)
    );
  },

  // Mettre à jour une candidature
  update: (applicationId: string, updates: Partial<Application>): void => {
    if (typeof window === 'undefined') return;
    try {
      const applications = applicationsStore.getAll();
      const updated = applications.map((app) => 
        app.id === applicationId 
          ? { ...app, ...updates }
          : app
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Mettre à jour dans Supabase en arrière-plan
      if (updates.status) {
        const selectedAt = updates.status === 'SELECTED' && updates.selectedAt ? updates.selectedAt : undefined;
        applicationsStoreSupabase.updateStatus(applicationId, updates.status, selectedAt).catch((error) => {
          console.warn('Échec de la mise à jour Supabase de la candidature:', error);
        });
      }
    } catch (error) {
      console.error('Error updating application:', error);
    }
  },

  // Nettoyer toutes les candidatures locales d'un modèle (utile en recréation de compte test)
  clearByModelId: (modelUserId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const applications = applicationsStore.getAll();
      const filtered = applications.filter((app) => app.modelUserId !== modelUserId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error clearing applications by model:', error);
    }
  },
};
