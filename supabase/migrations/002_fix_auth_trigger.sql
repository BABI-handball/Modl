-- Migration 002: Fix pour l'authentification
-- Ce script corrige les problèmes d'inscription en créant automatiquement l'entrée dans users

-- 1. Créer la fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'MODEL' -- Rôle par défaut, sera mis à jour à l'onboarding
  )
  ON CONFLICT (id) DO NOTHING; -- Éviter les doublons si le trigger est appelé plusieurs fois
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer le trigger s'il existe déjà (pour éviter les doublons)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Créer le trigger pour créer automatiquement l'entrée dans users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Créer la politique INSERT si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- 5. Vérification : Afficher les triggers et politiques créés
SELECT 
  'Trigger créé' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

SELECT 
  'Politique créée' as status,
  policyname as policy_name,
  tablename as table_name
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users' 
AND policyname = 'Users can insert own profile';
