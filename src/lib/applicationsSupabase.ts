/**
 * Store des candidatures avec Supabase
 * Migration depuis localStorage vers Supabase
 */

import { createClient } from './supabase/client';
import { Application } from '@/src/types';

export const applicationsStoreSupabase = {
  /**
   * Récupérer toutes les candidatures
   */
  getAll: async (): Promise<Application[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(
        'Supabase applications indisponible (données locales utilisées):',
        error.message ?? error.code ?? String(error)
      );
      return [];
    }

    // Convertir les données Supabase en format Application
    return (data || []).map((app) => ({
      id: app.id,
      jobId: app.job_id,
      modelUserId: app.model_user_id,
      message: app.message || '',
      status: app.status as 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED',
      createdAt: new Date(app.created_at),
    }));
  },

  /**
   * Récupérer une candidature par ID
   */
  getById: async (applicationId: string): Promise<Application | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      jobId: data.job_id,
      modelUserId: data.model_user_id,
      message: data.message || '',
      status: data.status as 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED',
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Récupérer les candidatures pour un job
   */
  getByJobId: async (jobId: string): Promise<Application[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(
        'Supabase candidatures par job:',
        error.message ?? error.code ?? String(error)
      );
      return [];
    }

    return (data || []).map((app) => ({
      id: app.id,
      jobId: app.job_id,
      modelUserId: app.model_user_id,
      message: app.message || '',
      status: app.status as 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED',
      createdAt: new Date(app.created_at),
    }));
  },

  /**
   * Récupérer les candidatures d'un modèle
   */
  getByModelId: async (modelUserId: string): Promise<Application[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('model_user_id', modelUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(
        'Supabase candidatures par modèle:',
        error.message ?? error.code ?? String(error)
      );
      return [];
    }

    return (data || []).map((app) => ({
      id: app.id,
      jobId: app.job_id,
      modelUserId: app.model_user_id,
      message: app.message || '',
      status: app.status as 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED',
      createdAt: new Date(app.created_at),
    }));
  },

  /**
   * Vérifier si un modèle a déjà postulé à un job
   */
  hasApplied: async (jobId: string, modelUserId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('model_user_id', modelUserId)
      .limit(1);

    if (error) {
      console.warn(
        'Supabase vérification candidature:',
        error.message ?? error.code ?? String(error)
      );
      return false;
    }

    return (data || []).length > 0;
  },

  /**
   * Créer une nouvelle candidature
   */
  add: async (application: Application): Promise<Application | null> => {
    const supabase = createClient();
    
    // Vérifier si model_user_id est un UUID valide
    // Les comptes dev ont des IDs comme "dev-model-1" qui ne sont pas des UUIDs
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(application.modelUserId);
    
    if (!isUUID) {
      console.warn(`⚠️ Impossible de sauvegarder la candidature dans Supabase: model_user_id "${application.modelUserId}" n'est pas un UUID valide. Les comptes dev ne peuvent pas être sauvegardés dans Supabase.`);
      return null;
    }
    
    console.log('💾 Tentative de sauvegarde dans Supabase:', {
      id: application.id,
      job_id: application.jobId,
      model_user_id: application.modelUserId,
      status: application.status,
    });
    
    const { data, error } = await supabase
      .from('applications')
      .insert({
        id: application.id,
        job_id: application.jobId,
        model_user_id: application.modelUserId,
        message: application.message,
        status: application.status,
        created_at: application.createdAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création de la candidature dans Supabase:', error);
      console.error('Détails:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log('✅ Candidature sauvegardée avec succès dans Supabase:', data);
    return {
      id: data.id,
      jobId: data.job_id,
      modelUserId: data.model_user_id,
      message: data.message || '',
      status: data.status as 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED',
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Mettre à jour le statut d'une candidature
   */
  updateStatus: async (applicationId: string, status: Application['status'], selectedAt?: Date): Promise<boolean> => {
    const supabase = createClient();
    
    const updateData: any = { status };
    
    // Si le statut est SELECTED, mettre à jour selected_at
    if (status === 'SELECTED' && selectedAt) {
      updateData.selected_at = selectedAt.toISOString();
    }
    
    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId);

    if (error) {
      console.error('Error updating application status:', error);
      return false;
    }

    return true;
  },

  /**
   * Supprimer une candidature
   */
  delete: async (applicationId: string): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      console.error('Error deleting application:', error);
      return false;
    }

    return true;
  },
};
