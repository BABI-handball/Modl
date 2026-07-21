-- Corriger le thread en ne gardant que les UUIDs valides (pas les IDs de messages)
UPDATE public.message_threads
SET participant_ids = (
  SELECT array_agg(DISTINCT from_id ORDER BY from_id)
  FROM (
    -- Participants existants dans le thread (filtrer pour ne garder que les UUIDs)
    SELECT unnest(participant_ids::UUID[]) as from_id
    FROM public.message_threads
    WHERE id = 'thread-1770815591833-epi7g4s0q'
      AND unnest(participant_ids::UUID[])::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    UNION
    -- Participants trouvés dans les messages (ce sont déjà des UUIDs)
    SELECT DISTINCT from_id
    FROM public.messages
    WHERE thread_id = 'thread-1770815591833-epi7g4s0q'
  ) combined
  WHERE from_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
)
WHERE id = 'thread-1770815591833-epi7g4s0q';
