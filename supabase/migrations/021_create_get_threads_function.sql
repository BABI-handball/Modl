-- Migration 021: Créer une fonction SQL pour rechercher un thread entre deux participants
-- Cette fonction évite les problèmes avec .contains() sur les tableaux UUID[]

CREATE OR REPLACE FUNCTION public.get_thread_between_participants(
  participant_a UUID,
  participant_b UUID
)
RETURNS TABLE (
  id TEXT,
  participant_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_message_id TEXT,
  deleted_by UUID[],
  deleted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.id,
    mt.participant_ids,
    mt.created_at,
    mt.updated_at,
    mt.last_message_id,
    mt.deleted_by,
    mt.deleted_at
  FROM public.message_threads mt
  WHERE 
    auth.uid() = ANY(mt.participant_ids)
    AND participant_a = ANY(mt.participant_ids)
    AND participant_b = ANY(mt.participant_ids)
  ORDER BY mt.updated_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_thread_between_participants(UUID, UUID) TO authenticated;
