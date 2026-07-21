-- Migration initiale pour MODL
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('MODEL', 'BRAND', 'PHOTOGRAPHER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils modèles
CREATE TABLE IF NOT EXISTS public.model_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  age INTEGER,
  height INTEGER,
  weight INTEGER,
  eye_color TEXT,
  hair_color TEXT,
  hair_length TEXT,
  skin_tone TEXT,
  bust INTEGER,
  waist INTEGER,
  hips INTEGER,
  shoe_size INTEGER,
  dress_size TEXT,
  arm_circumference INTEGER,
  bio TEXT,
  avatar_url TEXT,
  portfolio_images TEXT[],
  tags TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'NONE' CHECK (verification_status IN ('NONE', 'PENDING', 'APPROVED', 'REJECTED')),
  verification_photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils photographes
CREATE TABLE IF NOT EXISTS public.photographer_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  creative_type TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils marques
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  city TEXT,
  brand_type TEXT,
  website TEXT,
  bio TEXT,
  logo_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des annonces
CREATE TABLE IF NOT EXISTS public.job_posts (
  id TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_role TEXT NOT NULL CHECK (owner_role IN ('BRAND', 'PHOTOGRAPHER')),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration TEXT,
  pay_type TEXT NOT NULL CHECK (pay_type IN ('PAID', 'UNPAID')),
  pay_amount DECIMAL(10, 2),
  description TEXT NOT NULL,
  deliverables TEXT[],
  reference_images TEXT[],
  is_express_casting BOOLEAN DEFAULT FALSE,
  is_boosted BOOLEAN DEFAULT FALSE,
  boost_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des candidatures
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  model_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SHORTLISTED', 'REJECTED', 'SELECTED')),
  selected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des annonces sauvegardées
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  job_id TEXT NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  model_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (job_id, model_user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  from_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des threads de messages
CREATE TABLE IF NOT EXISTS public.message_threads (
  id TEXT PRIMARY KEY,
  participant_ids UUID[] NOT NULL,
  last_message_id TEXT REFERENCES public.messages(id),
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lectures de messages
CREATE TABLE IF NOT EXISTS public.message_reads (
  thread_id TEXT NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

-- Table des évaluations de modèles
CREATE TABLE IF NOT EXISTS public.model_reviews (
  id TEXT PRIMARY KEY,
  model_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  professionalism INTEGER NOT NULL CHECK (professionalism >= 1 AND professionalism <= 5),
  punctuality INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
  appearance INTEGER NOT NULL CHECK (appearance >= 1 AND appearance <= 5),
  attitude INTEGER NOT NULL CHECK (attitude >= 1 AND attitude <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_job_posts_owner ON public.job_posts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_model ON public.applications(model_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_from ON public.messages(from_id);
CREATE INDEX IF NOT EXISTS idx_model_reviews_model ON public.model_reviews(model_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_model ON public.saved_jobs(model_user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_profiles_updated_at BEFORE UPDATE ON public.model_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photographer_profiles_updated_at BEFORE UPDATE ON public.photographer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON public.brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_posts_updated_at BEFORE UPDATE ON public.job_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON public.message_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'MODEL' -- Rôle par défaut, sera mis à jour à l'onboarding
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement l'entrée dans users quand un utilisateur s'inscrit
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) - Politiques de sécurité
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base (à ajuster selon vos besoins)
-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Les profils sont publics en lecture
CREATE POLICY "Model profiles are viewable by everyone" ON public.model_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own model profile" ON public.model_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own model profile" ON public.model_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Même chose pour les autres profils
CREATE POLICY "Photographer profiles are viewable by everyone" ON public.photographer_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own photographer profile" ON public.photographer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Brand profiles are viewable by everyone" ON public.brand_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own brand profile" ON public.brand_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Les annonces sont publiques en lecture
CREATE POLICY "Job posts are viewable by everyone" ON public.job_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create own job posts" ON public.job_posts
    FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own job posts" ON public.job_posts
    FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own job posts" ON public.job_posts
    FOR DELETE USING (auth.uid() = owner_user_id);

-- Les candidatures sont visibles par le modèle et le propriétaire de l'annonce
CREATE POLICY "Applications are viewable by model and job owner" ON public.applications
    FOR SELECT USING (
        auth.uid() = model_user_id OR 
        auth.uid() IN (SELECT owner_user_id FROM public.job_posts WHERE id = job_id)
    );

CREATE POLICY "Models can create applications" ON public.applications
    FOR INSERT WITH CHECK (auth.uid() = model_user_id);

CREATE POLICY "Job owners can update applications" ON public.applications
    FOR UPDATE USING (
        auth.uid() IN (SELECT owner_user_id FROM public.job_posts WHERE id = job_id)
    );

-- Les messages sont visibles par les participants du thread
CREATE POLICY "Messages are viewable by thread participants" ON public.messages
    FOR SELECT USING (
        thread_id IN (
            SELECT id FROM public.message_threads 
            WHERE auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can create messages in their threads" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = from_id AND
        thread_id IN (
            SELECT id FROM public.message_threads 
            WHERE auth.uid() = ANY(participant_ids)
        )
    );
