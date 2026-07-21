-- Migration 022: Corriger la politique RLS sur message_reads
-- La politique actuelle est trop restrictive et bloque les INSERT pour les threads locaux

-- Supprimer l'ancienne politique INSERT trop restrictive
DROP POLICY IF EXISTS "Users can mark their threads as read" ON public.message_reads;

-- Créer une nouvelle politique INSERT plus permissive
-- Elle permet à un utilisateur de marquer n'importe quel thread comme lu pour lui-même
-- La vérification du thread se fait côté application, pas dans RLS
CREATE POLICY "Users can mark their threads as read" ON public.message_reads
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Ajouter une politique SELECT manquante
-- Les utilisateurs peuvent voir leurs propres statuts de lecture
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'message_reads' 
        AND policyname = 'Users can view their read status'
    ) THEN
        CREATE POLICY "Users can view their read status" ON public.message_reads
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- La politique UPDATE reste inchangée (déjà correcte)
-- Elle permet à un utilisateur de mettre à jour uniquement ses propres lectures
