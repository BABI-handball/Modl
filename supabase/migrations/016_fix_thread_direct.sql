-- Corriger directement le thread en mettant les deux UUIDs manuellement
-- Basé sur les résultats de la requête précédente qui a trouvé deux participants

UPDATE public.message_threads
SET participant_ids = ARRAY[
  '180b21c2-dcb7-4d5b-ab16-0492c9e2d07a'::UUID,
  'ae0316ac-9a33-4639-abbf-75852b101282'::UUID
]
WHERE id = 'thread-1770815591833-epi7g4s0q';
