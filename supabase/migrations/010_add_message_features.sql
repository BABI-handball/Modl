-- Migration pour ajouter les fonctionnalités de messages manquantes
-- 1. Suppression de messages (soft delete)
-- 2. Réactions aux messages
-- 3. Réponses aux messages
-- 4. Suppression de threads (soft delete)

-- Ajouter colonnes pour les messages
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reply_to_message_id TEXT REFERENCES public.messages(id) ON DELETE SET NULL;

-- Créer table pour les réactions aux messages
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  message_id TEXT NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Ajouter colonne pour soft delete des threads
ALTER TABLE public.message_threads
  ADD COLUMN IF NOT EXISTS deleted_by UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON public.messages(deleted) WHERE deleted = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

-- Activer RLS sur message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour message_reactions
DO $$ 
BEGIN
  -- SELECT: Les utilisateurs peuvent voir les réactions des messages dans leurs threads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'message_reactions' 
    AND policyname = 'Users can view reactions in their threads'
  ) THEN
    CREATE POLICY "Users can view reactions in their threads" ON public.message_reactions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.message_threads mt
          JOIN public.messages m ON m.thread_id = mt.id
          WHERE m.id = message_reactions.message_id
          AND (mt.participant_ids @> ARRAY[auth.uid()]::UUID[])
        )
      );
  END IF;

  -- INSERT: Les utilisateurs peuvent ajouter des réactions aux messages dans leurs threads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'message_reactions' 
    AND policyname = 'Users can add reactions in their threads'
  ) THEN
    CREATE POLICY "Users can add reactions in their threads" ON public.message_reactions
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1 FROM public.message_threads mt
          JOIN public.messages m ON m.thread_id = mt.id
          WHERE m.id = message_reactions.message_id
          AND (mt.participant_ids @> ARRAY[auth.uid()]::UUID[])
        )
      );
  END IF;

  -- DELETE: Les utilisateurs peuvent retirer leurs propres réactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'message_reactions' 
    AND policyname = 'Users can delete their own reactions'
  ) THEN
    CREATE POLICY "Users can delete their own reactions" ON public.message_reactions
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies pour UPDATE sur messages (pour soft delete)
DO $$ 
BEGIN
  -- UPDATE: Les utilisateurs peuvent marquer leurs propres messages comme supprimés
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'messages' 
    AND policyname = 'Users can update their own messages'
  ) THEN
    CREATE POLICY "Users can update their own messages" ON public.messages
      FOR UPDATE
      USING (
        auth.uid() = from_id
        AND EXISTS (
          SELECT 1 FROM public.message_threads mt
          WHERE mt.id = messages.thread_id
          AND (mt.participant_ids @> ARRAY[auth.uid()]::UUID[])
        )
      )
      WITH CHECK (
        auth.uid() = from_id
        AND EXISTS (
          SELECT 1 FROM public.message_threads mt
          WHERE mt.id = messages.thread_id
          AND (mt.participant_ids @> ARRAY[auth.uid()]::UUID[])
        )
      );
  END IF;
END $$;

-- RLS Policies pour UPDATE sur message_threads (pour soft delete)
DO $$ 
BEGIN
  -- UPDATE: Les utilisateurs peuvent marquer leurs threads comme supprimés
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'message_threads' 
    AND policyname = 'Users can update their threads'
  ) THEN
    CREATE POLICY "Users can update their threads" ON public.message_threads
      FOR UPDATE
      USING (participant_ids @> ARRAY[auth.uid()]::UUID[])
      WITH CHECK (participant_ids @> ARRAY[auth.uid()]::UUID[]);
  END IF;
END $$;
