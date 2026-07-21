-- Migration simple pour corriger les threads avec un seul participant
-- Met à jour directement les threads avec tous les participants trouvés dans les messages

DO $$
DECLARE
  thread_id_var TEXT;
  all_participants UUID[];
BEGIN
  -- Pour chaque thread qui a des messages
  FOR thread_id_var IN
    SELECT DISTINCT thread_id
    FROM public.messages
  LOOP
    -- Récupérer tous les participants uniques (existants + dans les messages)
    SELECT array_agg(DISTINCT participant_id ORDER BY participant_id)
    INTO all_participants
    FROM (
      -- Participants existants dans le thread
      SELECT unnest(participant_ids::UUID[]) as participant_id
      FROM public.message_threads
      WHERE id = thread_id_var
      UNION
      -- Participants trouvés dans les messages
      SELECT DISTINCT from_id as participant_id
      FROM public.messages
      WHERE thread_id = thread_id_var
    ) combined;
    
    -- Mettre à jour le thread si on a trouvé des participants
    IF all_participants IS NOT NULL THEN
      UPDATE public.message_threads
      SET participant_ids = all_participants
      WHERE id = thread_id_var;
      
      RAISE NOTICE 'Thread % mis à jour avec % participants', thread_id_var, array_length(all_participants, 1);
    END IF;
  END LOOP;
END $$;
