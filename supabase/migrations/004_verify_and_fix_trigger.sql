-- Migration 004: Vérification et correction du trigger
-- Exécutez ce script pour vérifier que tout fonctionne

-- 1. Vérifier que le trigger existe et est actif
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Actif'
    WHEN tgenabled = 'D' THEN '❌ Désactivé'
    ELSE '⚠️ Inconnu'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Vérifier que la fonction existe
SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'handle_new_user' THEN '✅ Fonction existe'
    ELSE '❌ Fonction manquante'
  END as status
FROM pg_proc 
WHERE proname = 'handle_new_user'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Vérifier les politiques RLS
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN policyname = 'Users can insert own profile' THEN '✅ Politique INSERT existe'
    ELSE '⚠️ Autre politique'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 4. Créer ou remplacer la fonction (toujours, pour s'assurer qu'elle est à jour)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'MODEL'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Supprimer le trigger s'il existe déjà (pour éviter les doublons)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 6. Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Créer la politique INSERT si elle n'existe pas
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
    
    RAISE NOTICE '✅ Politique INSERT créée';
  ELSE
    RAISE NOTICE '✅ Politique INSERT existe déjà';
  END IF;
END $$;

-- 8. Vérification finale
SELECT 'Vérification terminée' as status;
