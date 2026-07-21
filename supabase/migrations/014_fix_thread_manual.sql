-- Migration pour corriger manuellement le thread spécifique
-- Trouve tous les participants depuis les messages et met à jour le thread

-- D'abord, vérifier quels participants sont dans les messages
SELECT DISTINCT from_id, thread_id
FROM public.messages
WHERE thread_id = 'thread-1770815591833-epi7g4s0q'
ORDER BY from_id;

-- Ensuite, mettre à jour le thread avec tous les participants trouvés
UPDATE public.message_threads
SET participant_ids = (
  SELECT array_agg(DISTINCT from_id ORDER BY from_id)
  FROM (
    -- Participants existants dans le thread
    SELECT unnest(participant_ids::UUID[]) as from_id
    FROM public.message_threads
    WHERE id = 'thread-1770815591833-epi7g4s0q'
    UNION
    -- Participants trouvés dans les messages
    SELECT DISTINCT from_id
    FROM public.messages
    WHERE thread_id = 'thread-1770815591833-epi7g4s0q'
  ) combined
)
WHERE id = 'thread-1770815591833-epi7g4s0q';
