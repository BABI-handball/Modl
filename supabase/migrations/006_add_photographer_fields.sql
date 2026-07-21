-- Migration pour ajouter les champs manquants à photographer_profiles
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Ajouter les colonnes manquantes à photographer_profiles
ALTER TABLE public.photographer_profiles
ADD COLUMN IF NOT EXISTS portfolio_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS portfolio_link TEXT,
ADD COLUMN IF NOT EXISTS equipment TEXT,
ADD COLUMN IF NOT EXISTS style TEXT;

-- Ajouter les colonnes manquantes à brand_profiles si nécessaire
ALTER TABLE public.brand_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Ajouter les colonnes manquantes à model_profiles si nécessaire
ALTER TABLE public.model_profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gender TEXT;
