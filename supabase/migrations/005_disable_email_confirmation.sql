-- Migration 005: Désactiver la confirmation email (pour le développement uniquement)
-- ⚠️ RÉACTIVEZ EN PRODUCTION !

-- Note: Cette configuration se fait généralement via l'interface Supabase
-- Mais on peut aussi vérifier/modifier via les paramètres du projet

-- Pour désactiver la confirmation email, allez dans:
-- Supabase Dashboard > Authentication > Settings > "Enable email confirmations"
-- Et désactivez cette option

-- Si vous ne trouvez pas cette option, vérifiez dans:
-- Project Settings > Authentication > Email Auth Settings

-- Alternative: Utilisez l'API Supabase pour modifier cette configuration
-- Mais le plus simple reste l'interface web

SELECT 
  'Pour désactiver la confirmation email:' as instruction,
  '1. Allez dans Authentication > Settings' as step1,
  '2. Cherchez "Enable email confirmations"' as step2,
  '3. Désactivez cette option' as step3,
  '4. Sauvegardez' as step4;
