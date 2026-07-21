-- Migration temporaire pour assouplir la policy RLS sur les réactions
-- Permet d'ajouter des réactions si le message existe et que l'utilisateur est authentifié

DO $$
BEGIN
  -- Supprimer l'ancienne policy si elle existe
  DROP POLICY IF EXISTS "Users can add reactions in their threads" ON public.message_reactions;
  
  -- Créer une nouvelle policy plus permissive pour le debug
  -- Vérifie seulement que le message existe et que l'utilisateur est authentifié
  CREATE POLICY "Users can add reactions in their threads" ON public.message_reactions
    FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_reactions.message_id
      )
    );
END $$;
