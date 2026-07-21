-- Migration pour corriger les threads qui n'ont qu'un seul participant
-- En analysant les messages, on trouve tous les participants et on met à jour le thread

DO $$
DECLARE
  thread_record RECORD;
  unique_participants UUID[];
BEGIN
  -- Parcourir tous les threads
  FOR thread_record IN 
    SELECT id, participant_ids 
    FROM public.message_threads
  LOOP
    -- Récupérer tous les from_id uniques des messages de ce thread et fusionner avec les participants existants
    SELECT array_agg(DISTINCT from_id ORDER BY from_id)
    INTO unique_participants
    FROM (
      -- Participants existants dans le thread
      SELECT unnest(participant_ids::UUID[]) as from_id
      FROM public.message_threads
      WHERE id = thread_record.id
      UNION
      -- Participants trouvés dans les messages
      SELECT DISTINCT from_id
      FROM public.messages
      WHERE thread_id = thread_record.id
    ) all_participants;
    
    -- Si on a trouvé des participants et que c'est différent de l'existant
    IF unique_participants IS NOT NULL AND (
      thread_record.participant_ids IS NULL 
      OR array_length(unique_participants, 1) != array_length(thread_record.participant_ids::UUID[], 1)
      OR NOT (unique_participants <@ thread_record.participant_ids::UUID[] AND thread_record.participant_ids::UUID[] <@ unique_participants)
    ) THEN
      -- Mettre à jour le thread avec tous les participants
      UPDATE public.message_threads
      SET participant_ids = unique_participants
      WHERE id = thread_record.id;
      
      RAISE NOTICE 'Thread % mis à jour: % -> %', 
        thread_record.id, 
        thread_record.participant_ids, 
        unique_participants;
    END IF;
  END LOOP;
END $$;
