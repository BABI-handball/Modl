/**
 * Store Supabase pour les évaluations de modèles
 */

import { createClient } from './supabase/client';
import { ModelReview } from '@/src/types';

export const reviewsStoreSupabase = {
  /**
   * Créer une nouvelle évaluation
   */
  create: async (review: Omit<ModelReview, 'id' | 'createdAt' | 'overallRating'>): Promise<ModelReview | null> => {
    const supabase = createClient();
    
    // Vérifier si les IDs sont des UUIDs valides
    const isModelUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(review.modelUserId);
    const isReviewerUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(review.reviewerUserId);
    
    if (!isModelUUID || !isReviewerUUID) {
      console.warn('⚠️ Impossible de créer une évaluation Supabase: les IDs ne sont pas des UUIDs valides (comptes dev)');
      return null;
    }

    // Calculer la note globale (moyenne des 5 critères)
    const overallRating = (
      review.professionalism +
      review.punctuality +
      review.communication +
      review.appearance +
      review.attitude
    ) / 5;

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('model_reviews')
      .insert({
        id: reviewId,
        model_user_id: review.modelUserId,
        reviewer_user_id: review.reviewerUserId,
        job_id: review.jobId,
        application_id: review.applicationId,
        professionalism: review.professionalism,
        punctuality: review.punctuality,
        communication: review.communication,
        appearance: review.appearance,
        attitude: review.attitude,
        comment: review.comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'évaluation:', error);
      console.error('Détails:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    // Convertir en format ModelReview
    return {
      id: data.id,
      modelUserId: data.model_user_id,
      reviewerUserId: data.reviewer_user_id,
      jobId: data.job_id,
      applicationId: data.application_id,
      professionalism: data.professionalism,
      punctuality: data.punctuality,
      communication: data.communication,
      appearance: data.appearance,
      attitude: data.attitude,
      overallRating: Math.round(overallRating * 10) / 10,
      comment: data.comment || undefined,
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Récupérer toutes les évaluations d'un modèle
   */
  getByModelId: async (modelUserId: string): Promise<ModelReview[]> => {
    const supabase = createClient();
    
    // Vérifier si modelUserId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelUserId);
    if (!isUUID) {
      return []; // Comptes dev ne peuvent pas charger depuis Supabase
    }

    const { data, error } = await supabase
      .from('model_reviews')
      .select('*')
      .eq('model_user_id', modelUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
      return [];
    }

    return (data || []).map((review) => {
      const overallRating = (
        review.professionalism +
        review.punctuality +
        review.communication +
        review.appearance +
        review.attitude
      ) / 5;

      return {
        id: review.id,
        modelUserId: review.model_user_id,
        reviewerUserId: review.reviewer_user_id,
        jobId: review.job_id,
        applicationId: review.application_id,
        professionalism: review.professionalism,
        punctuality: review.punctuality,
        communication: review.communication,
        appearance: review.appearance,
        attitude: review.attitude,
        overallRating: Math.round(overallRating * 10) / 10,
        comment: review.comment || undefined,
        createdAt: new Date(review.created_at),
      };
    });
  },

  /**
   * Vérifier si une évaluation existe déjà pour une candidature
   */
  hasReviewForApplication: async (applicationId: string): Promise<boolean> => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        applicationId
      );
    if (!isUUID) {
      return false;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('model_reviews')
      .select('id')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (error) {
      console.warn(
        'Vérification évaluation (Supabase):',
        error.message ?? error.code ?? String(error)
      );
      return false;
    }

    return !!data;
  },

  /**
   * Récupérer une évaluation spécifique
   */
  getById: async (reviewId: string): Promise<ModelReview | null> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('model_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération de l\'évaluation:', error);
      }
      return null;
    }

    const overallRating = (
      data.professionalism +
      data.punctuality +
      data.communication +
      data.appearance +
      data.attitude
    ) / 5;

    return {
      id: data.id,
      modelUserId: data.model_user_id,
      reviewerUserId: data.reviewer_user_id,
      jobId: data.job_id,
      applicationId: data.application_id,
      professionalism: data.professionalism,
      punctuality: data.punctuality,
      communication: data.communication,
      appearance: data.appearance,
      attitude: data.attitude,
      overallRating: Math.round(overallRating * 10) / 10,
      comment: data.comment || undefined,
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Récupérer toutes les évaluations
   */
  getAll: async (): Promise<ModelReview[]> => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('model_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération de toutes les évaluations:', error);
      return [];
    }

    return (data || []).map((review) => {
      const overallRating = (
        review.professionalism +
        review.punctuality +
        review.communication +
        review.appearance +
        review.attitude
      ) / 5;

      return {
        id: review.id,
        modelUserId: review.model_user_id,
        reviewerUserId: review.reviewer_user_id,
        jobId: review.job_id,
        applicationId: review.application_id,
        professionalism: review.professionalism,
        punctuality: review.punctuality,
        communication: review.communication,
        appearance: review.appearance,
        attitude: review.attitude,
        overallRating: Math.round(overallRating * 10) / 10,
        comment: review.comment || undefined,
        createdAt: new Date(review.created_at),
      };
    });
  },
};
