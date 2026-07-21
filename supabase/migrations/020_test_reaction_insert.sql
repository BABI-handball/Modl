-- Test direct : insérer une réaction manuellement pour vérifier que ça fonctionne
-- Remplacez les valeurs par celles de votre message et utilisateur

-- D'abord, trouver un message ID dans votre thread
SELECT id, thread_id, from_id 
FROM public.messages 
WHERE thread_id = 'thread-1770815591833-epi7g4s0q'
ORDER BY created_at DESC
LIMIT 1;

-- Ensuite, insérer une réaction de test (remplacez msg-xxx par un vrai message ID)
-- INSERT INTO public.message_reactions (message_id, user_id, emoji)
-- VALUES ('msg-xxx', 'ae0316ac-9a33-4639-abbf-75852b101282'::UUID, '❤️');
