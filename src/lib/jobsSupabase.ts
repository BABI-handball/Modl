/**
 * Store des annonces avec Supabase
 * Exemple de migration depuis localStorage vers Supabase
 */

import { createClient } from './supabase/client';
import { JobPost } from '@/src/types';

export const jobsStoreSupabase = {
  /**
   * Récupérer toutes les annonces
   */
  getAll: async (): Promise<JobPost[] | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(
        'Supabase annonces indisponible (données locales utilisées):',
        error.message ?? error.code ?? String(error)
      );
      return null;
    }

    // Convertir les données Supabase en format JobPost
    return (data || []).map((job) => ({
      id: job.id,
      ownerUserId: job.owner_user_id,
      ownerRole: job.owner_role as 'BRAND' | 'PHOTOGRAPHER',
      title: job.title,
      type: job.type,
      location: job.location,
      date: new Date(job.date),
      duration: job.duration || '',
      payType: job.pay_type as 'PAID' | 'UNPAID',
      payAmount: job.pay_amount ? parseFloat(job.pay_amount.toString()) : null,
      description: job.description,
      deliverables: job.deliverables || [],
      referenceImages: job.reference_images || [],
      isExpressCasting: job.is_express_casting || false,
      isBoosted: job.is_boosted || false,
      boostUntil: job.boost_until ? new Date(job.boost_until) : undefined,
      createdAt: new Date(job.created_at),
    }));
  },

  /**
   * Récupérer une annonce par ID
   */
  getById: async (jobId: string): Promise<JobPost | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      ownerUserId: data.owner_user_id,
      ownerRole: data.owner_role as 'BRAND' | 'PHOTOGRAPHER',
      title: data.title,
      type: data.type,
      location: data.location,
      date: new Date(data.date),
      duration: data.duration || '',
      payType: data.pay_type as 'PAID' | 'UNPAID',
      payAmount: data.pay_amount ? parseFloat(data.pay_amount.toString()) : null,
      description: data.description,
      deliverables: data.deliverables || [],
      referenceImages: data.reference_images || [],
      isExpressCasting: data.is_express_casting || false,
      isBoosted: data.is_boosted || false,
      boostUntil: data.boost_until ? new Date(data.boost_until) : undefined,
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Récupérer les annonces d'un propriétaire
   */
  getByOwnerId: async (ownerId: string): Promise<JobPost[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('job_posts')
      .select('*')
      .eq('owner_user_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn(
        'Supabase annonces utilisateur:',
        error.message ?? error.code ?? String(error)
      );
      return [];
    }

    return (data || []).map((job) => ({
      id: job.id,
      ownerUserId: job.owner_user_id,
      ownerRole: job.owner_role as 'BRAND' | 'PHOTOGRAPHER',
      title: job.title,
      type: job.type,
      location: job.location,
      date: new Date(job.date),
      duration: job.duration || '',
      payType: job.pay_type as 'PAID' | 'UNPAID',
      payAmount: job.pay_amount ? parseFloat(job.pay_amount.toString()) : null,
      description: job.description,
      deliverables: job.deliverables || [],
      referenceImages: job.reference_images || [],
      isExpressCasting: job.is_express_casting || false,
      isBoosted: job.is_boosted || false,
      boostUntil: job.boost_until ? new Date(job.boost_until) : undefined,
      createdAt: new Date(job.created_at),
    }));
  },

  /**
   * Créer une nouvelle annonce
   */
  add: async (job: JobPost): Promise<JobPost | null> => {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('job_posts')
      .insert({
        id: job.id,
        owner_user_id: job.ownerUserId,
        owner_role: job.ownerRole,
        title: job.title,
        type: job.type,
        location: job.location,
        date: job.date.toISOString(),
        duration: job.duration,
        pay_type: job.payType,
        pay_amount: job.payAmount,
        description: job.description,
        deliverables: job.deliverables,
        reference_images: job.referenceImages,
        is_express_casting: job.isExpressCasting || false,
        is_boosted: job.isBoosted || false,
        boost_until: job.boostUntil?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn(
        'Création annonce Supabase:',
        error.message ?? error.code ?? String(error)
      );
      return null;
    }

    return {
      id: data.id,
      ownerUserId: data.owner_user_id,
      ownerRole: data.owner_role as 'BRAND' | 'PHOTOGRAPHER',
      title: data.title,
      type: data.type,
      location: data.location,
      date: new Date(data.date),
      duration: data.duration || '',
      payType: data.pay_type as 'PAID' | 'UNPAID',
      payAmount: data.pay_amount ? parseFloat(data.pay_amount.toString()) : null,
      description: data.description,
      deliverables: data.deliverables || [],
      referenceImages: data.reference_images || [],
      isExpressCasting: data.is_express_casting || false,
      isBoosted: data.is_boosted || false,
      boostUntil: data.boost_until ? new Date(data.boost_until) : undefined,
      createdAt: new Date(data.created_at),
    };
  },

  /**
   * Mettre à jour une annonce
   */
  update: async (jobId: string, updates: Partial<JobPost>): Promise<boolean> => {
    const supabase = createClient();
    
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.type) updateData.type = updates.type;
    if (updates.location) updateData.location = updates.location;
    if (updates.date) updateData.date = updates.date.toISOString();
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.payType) updateData.pay_type = updates.payType;
    if (updates.payAmount !== undefined) updateData.pay_amount = updates.payAmount;
    if (updates.description) updateData.description = updates.description;
    if (updates.deliverables) updateData.deliverables = updates.deliverables;
    if (updates.referenceImages) updateData.reference_images = updates.referenceImages;
    if (updates.isExpressCasting !== undefined) updateData.is_express_casting = updates.isExpressCasting;
    if (updates.isBoosted !== undefined) updateData.is_boosted = updates.isBoosted;
    if (updates.boostUntil) updateData.boost_until = updates.boostUntil.toISOString();

    const { error } = await supabase
      .from('job_posts')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.warn(
        'Mise à jour annonce Supabase:',
        error.message ?? error.code ?? String(error)
      );
      return false;
    }

    return true;
  },

  /**
   * Supprimer une annonce
   */
  delete: async (jobId: string): Promise<boolean> => {
    const supabase = createClient();
    const { error } = await supabase
      .from('job_posts')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.warn(
        'Suppression annonce Supabase:',
        error.message ?? error.code ?? String(error)
      );
      return false;
    }

    return true;
  },
};
