-- Migration 007: Ajouter les politiques INSERT manquantes pour les profils
-- Ces politiques permettent aux utilisateurs de créer leur propre profil

-- Politique INSERT pour brand_profiles (créer seulement si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'brand_profiles' 
        AND policyname = 'Users can insert own brand profile'
    ) THEN
        CREATE POLICY "Users can insert own brand profile" ON public.brand_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Politique INSERT pour photographer_profiles (créer seulement si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'photographer_profiles' 
        AND policyname = 'Users can insert own photographer profile'
    ) THEN
        CREATE POLICY "Users can insert own photographer profile" ON public.photographer_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
