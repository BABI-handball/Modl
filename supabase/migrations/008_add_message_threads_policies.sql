-- Migration 008: Ajouter les politiques RLS pour message_threads
-- Ces politiques permettent aux utilisateurs de créer et gérer leurs threads de messages

-- Politique SELECT : Les utilisateurs peuvent voir les threads où ils sont participants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'message_threads' 
        AND policyname = 'Users can view their threads'
    ) THEN
        CREATE POLICY "Users can view their threads" ON public.message_threads
            FOR SELECT USING (auth.uid() = ANY(participant_ids));
    END IF;
END $$;

-- Politique INSERT : Les utilisateurs peuvent créer des threads où ils sont participants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'message_threads' 
        AND policyname = 'Users can create threads'
    ) THEN
        CREATE POLICY "Users can create threads" ON public.message_threads
            FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
    END IF;
END $$;

-- Politique UPDATE : Les utilisateurs peuvent mettre à jour leurs threads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'message_threads' 
        AND policyname = 'Users can update their threads'
    ) THEN
        CREATE POLICY "Users can update their threads" ON public.message_threads
            FOR UPDATE USING (auth.uid() = ANY(participant_ids));
    END IF;
END $$;

-- Politique INSERT pour message_reads : Les utilisateurs peuvent marquer leurs threads comme lus
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'message_reads' 
        AND policyname = 'Users can mark their threads as read'
    ) THEN
        CREATE POLICY "Users can mark their threads as read" ON public.message_reads
            FOR INSERT WITH CHECK (
                auth.uid() = user_id AND
                thread_id IN (
                    SELECT id FROM public.message_threads 
                    WHERE auth.uid() = ANY(participant_ids)
                )
            );
    END IF;
END $$;

-- Politique UPDATE pour message_reads : Les utilisateurs peuvent mettre à jour leurs lectures
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'message_reads' 
        AND policyname = 'Users can update their read status'
    ) THEN
        CREATE POLICY "Users can update their read status" ON public.message_reads
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
