-- Migration pour ajouter les RLS policies pour saved_jobs et model_reviews

-- Policies pour saved_jobs
-- Les utilisateurs peuvent voir leurs propres annonces sauvegardées
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'saved_jobs' 
    AND policyname = 'Users can view own saved jobs'
  ) THEN
    CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
      FOR SELECT USING (auth.uid() = model_user_id);
  END IF;
END $$;

-- Les utilisateurs peuvent sauvegarder des annonces pour eux-mêmes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'saved_jobs' 
    AND policyname = 'Users can save jobs for themselves'
  ) THEN
    CREATE POLICY "Users can save jobs for themselves" ON public.saved_jobs
      FOR INSERT WITH CHECK (auth.uid() = model_user_id);
  END IF;
END $$;

-- Les utilisateurs peuvent retirer leurs propres annonces sauvegardées
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'saved_jobs' 
    AND policyname = 'Users can unsave their own jobs'
  ) THEN
    CREATE POLICY "Users can unsave their own jobs" ON public.saved_jobs
      FOR DELETE USING (auth.uid() = model_user_id);
  END IF;
END $$;

-- Policies pour model_reviews
-- Les évaluations sont visibles par tout le monde (pour afficher les stats publiques)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'model_reviews' 
    AND policyname = 'Reviews are viewable by everyone'
  ) THEN
    CREATE POLICY "Reviews are viewable by everyone" ON public.model_reviews
      FOR SELECT USING (true);
  END IF;
END $$;

-- Les utilisateurs peuvent créer des évaluations (marques/photographes évaluent les modèles)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'model_reviews' 
    AND policyname = 'Users can create reviews'
  ) THEN
    CREATE POLICY "Users can create reviews" ON public.model_reviews
      FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);
  END IF;
END $$;

-- Les utilisateurs peuvent voir leurs propres évaluations créées (pour modification si nécessaire)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'model_reviews' 
    AND policyname = 'Users can update own reviews'
  ) THEN
    CREATE POLICY "Users can update own reviews" ON public.model_reviews
      FOR UPDATE USING (auth.uid() = reviewer_user_id);
  END IF;
END $$;
