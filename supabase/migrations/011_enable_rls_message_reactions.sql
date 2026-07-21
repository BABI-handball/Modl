-- Activer RLS sur message_reactions si ce n'est pas déjà fait
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
