-- Créer une fonction SQL qui peut corriger les threads avec les permissions élevées
-- Cette fonction contourne RLS pour permettre la correction automatique

CREATE OR REPLACE FUNCTION public.fix_thread_participants(thread_id_param TEXT)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  all_participants UUID[];
BEGIN
  -- Récupérer tous les participants uniques depuis les messages
  SELECT array_agg(DISTINCT from_id ORDER BY from_id)
  INTO all_participants
  FROM (
    -- Participants existants dans le thread
    SELECT unnest(participant_ids::UUID[]) as from_id
    FROM public.message_threads
    WHERE id = thread_id_param
    UNION
    -- Participants trouvés dans les messages
    SELECT DISTINCT from_id
    FROM public.messages
    WHERE thread_id = thread_id_param
  ) combined;
  
  -- Mettre à jour le thread avec tous les participants
  IF all_participants IS NOT NULL THEN
    UPDATE public.message_threads
    SET participant_ids = all_participants
    WHERE id = thread_id_param;
  END IF;
  
  RETURN all_participants;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.fix_thread_participants(TEXT) TO authenticated;
