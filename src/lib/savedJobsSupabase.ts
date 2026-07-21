import { createClient } from './supabase/client';

/**
 * Store Supabase pour les annonces sauvegardées
 */
export const savedJobsStoreSupabase = {
  /**
   * Récupérer toutes les annonces sauvegardées d'un modèle
   */
  getByModelId: async (modelUserId: string): Promise<string[]> => {
    const supabase = createClient();
    
    // Vérifier si modelUserId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelUserId);
    if (!isUUID) {
      return []; // Comptes dev ne peuvent pas charger depuis Supabase
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('model_user_id', modelUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des annonces sauvegardées:', error);
      return [];
    }

    return (data || []).map(row => row.job_id);
  },

  /**
   * Vérifier si une annonce est sauvegardée
   */
  isSaved: async (jobId: string, modelUserId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si modelUserId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelUserId);
    if (!isUUID) {
      return false;
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('job_id', jobId)
      .eq('model_user_id', modelUserId)
      .single();

    if (error) {
      // Si l'erreur est "PGRST116" (not found), c'est normal
      if (error.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification de sauvegarde:', error);
      }
      return false;
    }

    return !!data;
  },

  /**
   * Sauvegarder une annonce
   */
  save: async (jobId: string, modelUserId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si modelUserId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelUserId);
    if (!isUUID) {
      // Ne pas logger pour les comptes dev, c'est normal
      return false;
    }

    // Vérifier d'abord si c'est déjà sauvegardé
    const alreadySaved = await savedJobsStoreSupabase.isSaved(jobId, modelUserId);
    if (alreadySaved) {
      return true; // Déjà sauvegardé
    }

    const { error } = await supabase
      .from('saved_jobs')
      .insert({
        job_id: jobId,
        model_user_id: modelUserId,
      });

    if (error) {
      // Si l'erreur est une violation de contrainte unique (déjà sauvegardé), c'est OK
      if (error.code === '23505') {
        // Violation de contrainte unique (déjà sauvegardé)
        return true;
      }
      
      // Si l'erreur est une violation de clé étrangère (job_id n'existe pas), c'est normal pour les annonces mock
      if (error.code === '23503') {
        // Violation de clé étrangère - l'annonce n'existe peut-être pas dans Supabase (annonce mock)
        console.log('ℹ️ Annonce non sauvegardée dans Supabase (annonce mock ou non synchronisée):', jobId);
        return false;
      }
      
      // Logger seulement si ce n'est pas une erreur silencieuse
      if (error.message && error.message !== '{}' && error.message !== '[object Object]') {
        console.error('Erreur lors de la sauvegarde de l\'annonce:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          jobId,
          modelUserId,
        });
      }
      return false;
    }

    return true;
  },

  /**
   * Retirer une annonce sauvegardée
   */
  unsave: async (jobId: string, modelUserId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si modelUserId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelUserId);
    if (!isUUID) {
      return false;
    }

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('model_user_id', modelUserId);

    if (error) {
      console.error('Erreur lors de la suppression de l\'annonce sauvegardée:', error);
      console.error('Détails:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        jobId,
        modelUserId,
      });
      return false;
    }

    return true;
  },
};
