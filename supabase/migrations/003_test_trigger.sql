-- Migration 003: Test et vérification du trigger
-- Exécutez ce script pour vérifier que le trigger fonctionne correctement

-- 1. Vérifier que le trigger existe
SELECT 
  'Trigger status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN '✅ Trigger existe'
    ELSE '❌ Trigger manquant'
  END as status;

-- 2. Vérifier que la fonction existe
SELECT 
  'Function status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✅ Fonction existe'
    ELSE '❌ Fonction manquante'
  END as status;

-- 3. Vérifier que la politique INSERT existe
SELECT 
  'Policy status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = 'users' 
      AND policyname = 'Users can insert own profile'
    ) THEN '✅ Politique INSERT existe'
    ELSE '❌ Politique INSERT manquante'
  END as status;

-- 4. Vérifier les permissions de la fonction
SELECT 
  'Function permissions' as check_type,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user'
AND n.nspname = 'public';
