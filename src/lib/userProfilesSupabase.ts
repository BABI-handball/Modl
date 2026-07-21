/**
 * Store des profils utilisateurs avec Supabase
 * Migration depuis localStorage vers Supabase
 */

import { createClient } from './supabase/client';
import { ModelProfile, PhotographerProfile, BrandProfile } from '@/src/types';

function toSerializableError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }

  const anyError = error as { message?: string; details?: string; hint?: string; code?: string };
  return {
    message: anyError.message || 'unknown error',
    details: anyError.details || null,
    hint: anyError.hint || null,
    code: anyError.code || null,
  };
}

function normalizeVerificationStatus(status?: string): 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' {
  if (!status) return 'NONE';
  if (status === 'VERIFIED') return 'APPROVED';
  if (status === 'NONE' || status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
    return status;
  }
  return 'NONE';
}

export const userProfilesSupabase = {
  /**
   * Récupérer un profil modèle
   */
  getModelProfile: async (userId: string): Promise<ModelProfile | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('model_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      userId: data.user_id,
      name: data.name,
      city: data.city || '',
      age: data.age || undefined,
      height: data.height || undefined,
      weight: data.weight || undefined,
      eyeColor: data.eye_color || undefined,
      hairColor: data.hair_color || undefined,
      hairLength: data.hair_length || undefined,
      skinTone: data.skin_tone || undefined,
      bust: data.bust || undefined,
      waist: data.waist || undefined,
      hips: data.hips || undefined,
      shoeSize: data.shoe_size || undefined,
      dressSize: data.dress_size || undefined,
      armCircumference: data.arm_circumference || undefined,
      bio: data.bio || '',
      avatarUrl: data.avatar_url || undefined,
      portfolioImages: data.portfolio_images || [],
      tags: (data.tags || []) as any[],
      verified: data.verified || false,
      verificationStatus: data.verification_status as any,
      verificationPhotos: data.verification_photos || [],
    };
  },

  /**
   * Créer ou mettre à jour un profil modèle
   */
  setModelProfile: async (profile: ModelProfile): Promise<ModelProfile | null> => {
    const supabase = createClient();

    const fullPayload = {
      user_id: profile.userId,
      name: profile.name,
      email: profile.email,
      city: profile.city,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      eye_color: profile.eyeColor,
      hair_color: profile.hairColor,
      hair_length: profile.hairLength,
      skin_tone: profile.skinTone,
      bust: profile.bust,
      waist: profile.waist,
      hips: profile.hips,
      shoe_size: profile.shoeSize,
      dress_size: profile.dressSize,
      arm_circumference: profile.armCircumference,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      portfolio_images: profile.portfolioImages,
      tags: profile.tags || [],
      experience_years: profile.experienceYears || 0,
      gender: profile.gender,
      verified: profile.verified || false,
      verification_status: normalizeVerificationStatus(profile.verificationStatus),
      verification_photos: profile.verificationPhotos || [],
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('model_profiles')
      .upsert(fullPayload, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      // Fallback si certaines colonnes n'existent pas encore (migrations incomplètes).
      const fallbackPayload = {
        user_id: profile.userId,
        name: profile.name,
        city: profile.city,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        eye_color: profile.eyeColor,
        hair_color: profile.hairColor,
        hair_length: profile.hairLength,
        skin_tone: profile.skinTone,
        bust: profile.bust,
        waist: profile.waist,
        hips: profile.hips,
        shoe_size: profile.shoeSize,
        dress_size: profile.dressSize,
        arm_circumference: profile.armCircumference,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        portfolio_images: profile.portfolioImages,
        tags: profile.tags || [],
        verified: profile.verified || false,
        verification_status: normalizeVerificationStatus(profile.verificationStatus),
        verification_photos: profile.verificationPhotos || [],
        updated_at: new Date().toISOString(),
      };

      const retry = await supabase
        .from('model_profiles')
        .upsert(fallbackPayload, { onConflict: 'user_id' })
        .select()
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase model profile save skipped/failed:', toSerializableError(error));
      return null;
    }

    return {
      userId: data.user_id,
      name: data.name,
      city: data.city || '',
      age: data.age || undefined,
      height: data.height || undefined,
      weight: data.weight || undefined,
      eyeColor: data.eye_color || undefined,
      hairColor: data.hair_color || undefined,
      hairLength: data.hair_length || undefined,
      skinTone: data.skin_tone || undefined,
      bust: data.bust || undefined,
      waist: data.waist || undefined,
      hips: data.hips || undefined,
      shoeSize: data.shoe_size || undefined,
      dressSize: data.dress_size || undefined,
      armCircumference: data.arm_circumference || undefined,
      bio: data.bio || '',
      avatarUrl: data.avatar_url || undefined,
      portfolioImages: data.portfolio_images || [],
      tags: (data.tags || []) as any[],
      verified: data.verified || false,
      verificationStatus: data.verification_status as any,
      verificationPhotos: data.verification_photos || [],
    };
  },

  /**
   * Récupérer un profil photographe
   */
  getPhotographerProfile: async (userId: string): Promise<PhotographerProfile | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('photographer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      userId: data.user_id,
      name: data.name,
      city: data.city || '',
      bio: data.bio || '',
      avatarUrl: data.avatar_url || undefined,
      creativeType: data.creative_type as any,
      portfolioImages: data.portfolio_images || [],
      specialties: (data.specialties || []) as any[],
      portfolioLink: data.portfolio_link || undefined,
      equipment: data.equipment || undefined,
      style: data.style || undefined,
    };
  },

  /**
   * Créer ou mettre à jour un profil photographe
   */
  setPhotographerProfile: async (profile: PhotographerProfile): Promise<PhotographerProfile | null> => {
    const supabase = createClient();

    const fullPayload = {
      user_id: profile.userId,
      name: profile.name,
      city: profile.city,
      bio: profile.bio,
      avatar_url: profile.avatarUrl,
      creative_type: profile.creativeType,
      portfolio_images: profile.portfolioImages || [],
      specialties: profile.specialties || [],
      portfolio_link: profile.portfolioLink,
      equipment: profile.equipment,
      style: profile.style,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('photographer_profiles')
      .upsert(fullPayload, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      const fallbackPayload = {
        user_id: profile.userId,
        name: profile.name,
        city: profile.city,
        bio: profile.bio,
        avatar_url: profile.avatarUrl,
        creative_type: profile.creativeType,
        updated_at: new Date().toISOString(),
      };

      const retry = await supabase
        .from('photographer_profiles')
        .upsert(fallbackPayload, { onConflict: 'user_id' })
        .select()
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase photographer profile save skipped/failed:', toSerializableError(error));
      return null;
    }

    return {
      userId: data.user_id,
      name: data.name,
      city: data.city || '',
      bio: data.bio || '',
      avatarUrl: data.avatar_url || undefined,
      creativeType: data.creative_type as any,
      portfolioImages: data.portfolio_images || [],
      specialties: (data.specialties || []) as any[],
      portfolioLink: data.portfolio_link || undefined,
      equipment: data.equipment || undefined,
      style: data.style || undefined,
    };
  },

  /**
   * Récupérer un profil marque
   */
  getBrandProfile: async (userId: string): Promise<BrandProfile | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      userId: data.user_id,
      companyName: data.company_name,
      city: data.city || '',
      bio: data.bio || '',
      website: data.website || undefined,
      logoUrl: data.logo_url || undefined,
      brandType: data.brand_type as any,
    };
  },

  /**
   * Créer ou mettre à jour un profil marque
   */
  setBrandProfile: async (profile: BrandProfile): Promise<BrandProfile | null> => {
    const supabase = createClient();

    const fullPayload = {
      user_id: profile.userId,
      company_name: profile.companyName,
      email: profile.email,
      city: profile.city,
      bio: profile.bio,
      website: profile.website,
      logo_url: profile.logoUrl,
      brand_type: profile.brandType,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('brand_profiles')
      .upsert(fullPayload, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      const fallbackPayload = {
        user_id: profile.userId,
        company_name: profile.companyName,
        city: profile.city,
        bio: profile.bio,
        website: profile.website,
        logo_url: profile.logoUrl,
        brand_type: profile.brandType,
        updated_at: new Date().toISOString(),
      };

      const retry = await supabase
        .from('brand_profiles')
        .upsert(fallbackPayload, { onConflict: 'user_id' })
        .select()
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Supabase brand profile save skipped/failed:', toSerializableError(error));
      return null;
    }

    return {
      userId: data.user_id,
      companyName: data.company_name,
      city: data.city || '',
      bio: data.bio || '',
      website: data.website || undefined,
      logoUrl: data.logo_url || undefined,
      brandType: data.brand_type as any,
    };
  },
};
