/**
 * Store des messages avec Supabase
 * Migration depuis localStorage vers Supabase
 */

import { createClient } from './supabase/client';
import { Thread, Message, ParticipantSummary } from '@/src/types/messaging';
import { userStore } from './userStore';
import { mockModelProfiles, mockBrandProfiles, mockPhotographerProfiles } from '@/src/data/mock';

// Helper pour obtenir un ParticipantSummary depuis un userId
const getParticipantSummary = (userId: string): ParticipantSummary | null => {
  const modelProfile = userStore.getModelProfile(userId);
  if (modelProfile) {
    return {
      id: modelProfile.userId,
      name: modelProfile.name,
      role: 'MODEL',
      avatarUrl: modelProfile.avatarUrl || modelProfile.portfolioImages?.[0],
    };
  }

  const photographerProfile = userStore.getPhotographerProfile(userId);
  if (photographerProfile) {
    return {
      id: photographerProfile.userId,
      name: photographerProfile.name,
      role: 'PHOTOGRAPHER',
      avatarUrl: photographerProfile.avatarUrl || photographerProfile.portfolioImages?.[0],
    };
  }

  const brandProfile = userStore.getBrandProfile(userId);
  if (brandProfile) {
    return {
      id: brandProfile.userId,
      name: brandProfile.companyName,
      role: 'BRAND',
      avatarUrl: brandProfile.logoUrl,
    };
  }

  // Fallback sur les mock profiles
  const mockModel = mockModelProfiles.find(p => p.userId === userId);
  if (mockModel) {
    return {
      id: mockModel.userId,
      name: mockModel.name,
      role: 'MODEL',
      avatarUrl: mockModel.portfolioImages[0],
    };
  }

  const mockBrand = mockBrandProfiles.find(p => p.userId === userId);
  if (mockBrand) {
    return {
      id: mockBrand.userId,
      name: mockBrand.companyName,
      role: 'BRAND',
    };
  }

  const mockPhotographer = mockPhotographerProfiles.find(p => p.userId === userId);
  if (mockPhotographer) {
    return {
      id: mockPhotographer.userId,
      name: mockPhotographer.name,
      role: 'PHOTOGRAPHER',
      avatarUrl: mockPhotographer.portfolioImages[0],
    };
  }

  return null;
};

export const messagesStoreSupabase = {
  /**
   * Récupérer ou créer un thread entre deux participants
   */
  getOrCreateThread: async (
    participantAId: string,
    participantBId: string,
    listingId?: string,
    initialMessage?: string,
    preferredId?: string
  ): Promise<string> => {
    const supabase = createClient();
    
    // Vérifier si les IDs sont des UUIDs valides (comptes Supabase)
    const isUUIDA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(participantAId);
    const isUUIDB = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(participantBId);
    
    if (!isUUIDA || !isUUIDB) {
      console.warn('Impossible de créer un thread Supabase: participants non-UUID');
      return '';
    }

    const { data: allThreads, error: threadsError } = await supabase
      .from('message_threads')
      .select('*')
      .order('updated_at', { ascending: false });

    if (threadsError) {
      console.error('Erreur lors de la récupération des threads:', threadsError);
      return '';
    }

    if (allThreads) {
      const matchingThread = allThreads.find(thread => {
        const participantIds = thread.participant_ids as string[];
        return participantIds.includes(participantAId) && participantIds.includes(participantBId);
      });
      
      if (matchingThread) {
        return matchingThread.id;
      }
    }

    const threadId =
      preferredId ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `thread-${crypto.randomUUID()}`
        : `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    const { data: newThread, error: createError } = await supabase
      .from('message_threads')
      .insert({
        id: threadId,
        participant_ids: [participantAId, participantBId],
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur lors de la création du thread:', createError);
      return '';
    }

    // Message initial uniquement si on crée le thread (évite doublon avec le store local)
    if (initialMessage && newThread && !preferredId) {
      await messagesStoreSupabase.sendMessage(threadId, initialMessage, participantAId);
    }

    return threadId;
  },

  /**
   * Envoyer un message
   */
  sendMessage: async (
    threadId: string,
    text: string,
    fromId: string,
    attachments?: Message['attachments'],
    replyTo?: Message['replyTo']
  ): Promise<Message | null> => {
    const supabase = createClient();
    
    // Vérifier si fromId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fromId);
    if (!isUUID) {
      // Ne pas logger pour les comptes dev, c'est normal
      return null;
    }

    // Vérifier que le thread existe dans Supabase
    const { data: threadExists, error: threadCheckError } = await supabase
      .from('message_threads')
      .select('id, participant_ids')
      .eq('id', threadId)
      .single();

    if (!threadExists || threadCheckError) {
      // Thread n'existe pas encore dans Supabase avec cet ID
      // Peut-être que le thread existe avec un ID différent (créé par getOrCreateThread)
      // On ne peut pas le créer ici sans connaître les participants
      // Le message sera seulement local pour l'instant
      console.log('⚠️ Thread non trouvé dans Supabase avec l\'ID:', threadId);
      return null;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Préparer les données pour Supabase
    const messageData: any = {
      id: messageId,
      thread_id: threadId,
      from_id: fromId,
      text: text.trim(),
    };

    // Ajouter les attachments si présents (stockés en JSONB)
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }

    // Ajouter reply_to_message_id si présent
    if (replyTo?.messageId) {
      messageData.reply_to_message_id = replyTo.messageId;
    }

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      console.error('Détails:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    // Mettre à jour le thread avec le dernier message
    await supabase
      .from('message_threads')
      .update({
        last_message_id: messageId,
        last_message_at: newMessage.created_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    // Récupérer les réactions pour ce message (vide pour un nouveau message)
    const reactions: Message['reactions'] = [];

    let resolvedReplyTo = replyTo;
    if (!resolvedReplyTo && newMessage.reply_to_message_id) {
      const { data: parent } = await supabase
        .from('messages')
        .select('from_id, text')
        .eq('id', newMessage.reply_to_message_id)
        .single();
      if (parent) {
        resolvedReplyTo = {
          messageId: newMessage.reply_to_message_id,
          fromId: parent.from_id,
          text: parent.text,
        };
      }
    }

    // Convertir en format Message
    return {
      id: newMessage.id,
      threadId: newMessage.thread_id,
      fromId: newMessage.from_id,
      text: newMessage.text,
      attachments: newMessage.attachments || undefined,
      createdAt: new Date(newMessage.created_at),
      status: 'sent', // Par défaut, sera mis à jour via message_reads
      replyTo: resolvedReplyTo,
      deleted: newMessage.deleted || false,
      reactions: reactions,
    };
  },

  /**
   * Récupérer les threads d'un utilisateur
   */
  getThreadsForUser: async (userId: string): Promise<Thread[]> => {
    const supabase = createClient();
    
    // Vérifier si userId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      return []; // Comptes dev ne peuvent pas charger depuis Supabase
    }

    // Vérifier que l'utilisateur est authentifié
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || authUser.id !== userId) {
      console.warn('⚠️ Utilisateur non authentifié ou ID ne correspond pas');
      return [];
    }

    // La politique RLS filtre automatiquement les threads où auth.uid() est dans participant_ids
    // On n'a pas besoin d'utiliser .contains() qui cause des erreurs 406
    const { data: threads, error } = await supabase
      .from('message_threads')
      .select('*')
      .order('updated_at', { ascending: false });

    // Filtrer les threads supprimés par cet utilisateur
    const filteredThreads = (threads || []).filter(thread => {
      const deletedBy = (thread.deleted_by as string[]) || [];
      return !deletedBy.includes(userId);
    });

    // Corriger automatiquement les threads avec un seul participant
    for (const thread of filteredThreads) {
      const participantIds = thread.participant_ids as string[];
      
      // Si le thread n'a qu'un seul participant, chercher les autres dans les messages
      if (participantIds.length === 1) {
        const { data: messages } = await supabase
          .from('messages')
          .select('from_id')
          .eq('thread_id', thread.id)
          .limit(20);
        
        if (messages && messages.length > 0) {
          const uniqueFromIds = [...new Set(messages.map(m => m.from_id))];
          const allParticipants = [...new Set([...participantIds, ...uniqueFromIds])];
          
          if (allParticipants.length > participantIds.length) {
            console.log('🔧 Correction automatique du thread:', {
              threadId: thread.id,
              ancien: participantIds,
              nouveau: allParticipants,
            });
            
            // Mettre à jour le thread
            await supabase
              .from('message_threads')
              .update({ participant_ids: allParticipants })
              .eq('id', thread.id);
            
            // Mettre à jour le thread dans la liste
            thread.participant_ids = allParticipants;
          }
        }
      }
    }

    if (error) {
      console.error('Erreur lors de la récupération des threads:', error);
      return [];
    }

    // Convertir en format Thread
    const convertedThreads: Thread[] = [];
    
    for (const thread of filteredThreads) {
      const participantIds = thread.participant_ids as string[];
      const participantSummaries: ParticipantSummary[] = [];
      
      // Récupérer les résumés des participants
      for (const pid of participantIds) {
        const summary = getParticipantSummary(pid);
        if (summary) {
          participantSummaries.push(summary);
        }
      }

      // Récupérer le dernier message si disponible
      let lastMessage: Thread['lastMessage'] | undefined;
      if (thread.last_message_id) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('id', thread.last_message_id)
          .single();
        
        if (lastMsg) {
          lastMessage = {
            text: lastMsg.text,
            createdAt: new Date(lastMsg.created_at),
            fromId: lastMsg.from_id,
          };
        }
      }

      convertedThreads.push({
        id: thread.id,
        participantIds: participantIds,
        participantSummaries,
        lastMessage,
        createdAt: new Date(thread.created_at),
        updatedAt: new Date(thread.updated_at),
        // listingId n'est pas dans le schéma Supabase pour l'instant
      });
    }

    return convertedThreads;
  },

  /**
   * Récupérer les messages d'un thread
   */
  getMessagesByThread: async (threadId: string): Promise<Message[]> => {
    const supabase = createClient();
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Récupérer toutes les réactions pour ces messages
    const messageIds = messages.map(m => m.id);
    const { data: reactions } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds);

    // Grouper les réactions par message_id
    const reactionsByMessage = new Map<string, Message['reactions']>();
    if (reactions) {
      for (const reaction of reactions) {
        if (!reactionsByMessage.has(reaction.message_id)) {
          reactionsByMessage.set(reaction.message_id, []);
        }
        reactionsByMessage.get(reaction.message_id)!.push({
          emoji: reaction.emoji,
          userId: reaction.user_id,
          createdAt: new Date(reaction.created_at),
        });
      }
    }

    // Récupérer les lectures pour déterminer le statut
    const { data: reads } = await supabase
      .from('message_reads')
      .select('*')
      .eq('thread_id', threadId);

    const readMessageIds = new Set(
      reads?.map(r => {
        // Pour chaque lecture, récupérer les messages lus après last_read_at
        // Pour simplifier, on considère que tous les messages avant last_read_at sont lus
        return r.last_read_at;
      }) || []
    );

    const msgById = new Map(messages.map((m) => [m.id, m]));

    return messages.map((msg) => {
      const parent =
        msg.reply_to_message_id != null ? msgById.get(msg.reply_to_message_id) : undefined;
      const replyTo =
        msg.reply_to_message_id && parent
          ? {
              messageId: msg.reply_to_message_id,
              fromId: parent.from_id,
              text: parent.deleted ? undefined : parent.text,
            }
          : undefined;

      return {
        id: msg.id,
        threadId: msg.thread_id,
        fromId: msg.from_id,
        text: msg.deleted ? '' : msg.text, // Si supprimé, texte vide
        attachments: msg.deleted ? [] : (msg.attachments || undefined),
        createdAt: new Date(msg.created_at),
        status: 'sent' as const, // Simplifié pour l'instant
        deleted: msg.deleted || false,
        replyTo,
        reactions: reactionsByMessage.get(msg.id) || undefined,
      };
    });
  },

  /**
   * Marquer les messages d'un thread comme lus
   */
  markRead: async (threadId: string, userId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si userId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      // Ne pas logger pour les comptes dev, c'est normal
      return false;
    }

    // Vérifier que le thread existe dans Supabase
    const { data: threadExists } = await supabase
      .from('message_threads')
      .select('id')
      .eq('id', threadId)
      .single();

    if (!threadExists) {
      // Thread n'existe pas encore dans Supabase, c'est normal pour les threads locaux
      return false;
    }

    const { error } = await supabase
      .from('message_reads')
      .upsert({
        thread_id: threadId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      }, {
        onConflict: 'thread_id,user_id',
      });

    if (error) {
      // Ne pas logger si c'est juste un thread non synchronisé ou un compte dev
      const errorMsg = error.message || String(error);
      const errorCode = error.code || '';
      // Ignorer les erreurs attendues (UUID invalide, thread non trouvé, etc.)
      if (
        errorMsg !== '{}' && 
        errorMsg !== '[object Object]' && 
        !errorMsg.includes('UUID') && 
        !errorMsg.includes('uuid') &&
        errorCode !== 'PGRST116' && // Not found
        !errorMsg.includes('not found')
      ) {
        console.error('Erreur lors du marquage comme lu:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          threadId,
          userId,
        });
      }
      return false;
    }

    return true;
  },

  /**
   * Ajouter ou retirer une réaction à un message
   */
  toggleReaction: async (messageId: string, emoji: string, userId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si userId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      // Ne pas logger pour les comptes dev, c'est normal
      return false;
    }

    // Vérifier que le message existe dans Supabase et récupérer son thread_id
    const { data: messageData, error: messageCheckError } = await supabase
      .from('messages')
      .select('id, thread_id')
      .eq('id', messageId)
      .single();

    if (!messageData || messageCheckError) {
      // Message n'existe pas encore dans Supabase (message local uniquement)
      // C'est normal, on ne peut pas ajouter de réaction à un message qui n'existe pas dans Supabase
      console.log('⚠️ Message non trouvé dans Supabase avec l\'ID:', messageId);
      return false;
    }

    // Corriger automatiquement le thread si nécessaire
    const { data: threadData } = await supabase
      .from('message_threads')
      .select('participant_ids')
      .eq('id', messageData.thread_id)
      .single();

    if (threadData) {
      const participantIds = threadData.participant_ids as string[];
      
      // Si le thread n'a qu'un seul participant, le corriger avec tous les participants des messages
      if (participantIds.length === 1) {
        const { data: messages } = await supabase
          .from('messages')
          .select('from_id')
          .eq('thread_id', messageData.thread_id)
          .limit(50);
        
        if (messages && messages.length > 0) {
          const uniqueFromIds = [...new Set(messages.map(m => m.from_id))];
          const allParticipants = [...new Set([...participantIds, ...uniqueFromIds])];
          
          if (allParticipants.length > participantIds.length) {
            console.log('🔧 Correction automatique du thread pour les réactions:', {
              threadId: messageData.thread_id,
              ancien: participantIds,
              nouveau: allParticipants,
            });
            
            // Utiliser la fonction SQL qui contourne RLS
            const { data: fixedParticipants, error: fixError } = await supabase
              .rpc('fix_thread_participants', { thread_id_param: messageData.thread_id });
            
            if (fixError) {
              console.error('❌ Erreur lors de la correction automatique du thread:', fixError);
              // Essayer quand même avec update normal (peut échouer à cause de RLS)
              await supabase
                .from('message_threads')
                .update({ participant_ids: allParticipants })
                .eq('id', messageData.thread_id);
            } else {
              console.log('✅ Thread corrigé avec succès:', fixedParticipants);
            }
          }
        }
      }
    }

    // Vérifier si la réaction existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, c'est normal si la réaction n'existe pas
      const errorMsg = checkError.message || String(checkError);
      if (errorMsg !== '{}' && errorMsg !== '[object Object]') {
        console.error('Erreur lors de la vérification de la réaction:', {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint,
        });
      }
      return false;
    }

    if (existing) {
      // Retirer la réaction
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (error) {
        const errorMsg = error.message || String(error);
        if (errorMsg !== '{}' && errorMsg !== '[object Object]') {
          console.error('Erreur lors de la suppression de la réaction:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            messageId,
            userId,
            emoji,
          });
        }
        return false;
      }
    } else {
      // Vérifier l'authentification Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔐 Utilisateur authentifié Supabase:', {
        authUserId: authUser?.id,
        userIdPassed: userId,
        match: authUser?.id === userId,
      });

      // Ajouter la réaction
      console.log('💚 Tentative d\'ajout de réaction:', {
        messageId,
        userId,
        emoji,
        authUserId: authUser?.id,
      });

      // Vérifier d'abord le thread pour debug
      const { data: messageData } = await supabase
        .from('messages')
        .select('thread_id')
        .eq('id', messageId)
        .single();

      if (messageData) {
        const { data: threadData, error: threadError } = await supabase
          .from('message_threads')
          .select('participant_ids')
          .eq('id', messageData.thread_id)
          .single();

        console.log('🔍 Debug thread:', {
          threadId: messageData.thread_id,
          participantIds: threadData?.participant_ids,
          currentUserId: userId,
          authUserId: authUser?.id,
          isParticipant: threadData?.participant_ids?.includes(userId),
          authIsParticipant: authUser?.id ? threadData?.participant_ids?.includes(authUser.id) : false,
          threadError: threadError ? {
            code: threadError.code,
            message: threadError.message,
          } : null,
        });

        // Si l'utilisateur authentifié n'est pas dans participant_ids, c'est le problème
        if (authUser?.id && threadData?.participant_ids && !threadData.participant_ids.includes(authUser.id)) {
          console.error('❌ PROBLÈME: L\'utilisateur authentifié n\'est pas dans participant_ids!', {
            authUserId: authUser.id,
            participantIds: threadData.participant_ids,
          });
        }
      }

      console.log('📤 Données à insérer:', {
        message_id: messageId,
        user_id: userId,
        emoji: emoji,
        authUserId: authUser?.id,
      });

      const { data: insertedData, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji: emoji,
        })
        .select();

      if (error) {
        console.error('❌ Erreur lors de l\'ajout de la réaction:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          messageId,
          userId,
          emoji,
          authUserId: authUser?.id,
          fullError: error,
        });
        return false;
      }

      console.log('✅ Réaction ajoutée avec succès:', insertedData);
    }

    return true;
  },

  /**
   * Supprimer un message (soft delete)
   */
  deleteMessage: async (messageId: string, userId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si userId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      return false;
    }

    // Vérifier que l'utilisateur est bien l'auteur du message
    const { data: message } = await supabase
      .from('messages')
      .select('from_id')
      .eq('id', messageId)
      .single();

    if (!message || message.from_id !== userId) {
      return false;
    }

    // Soft delete: marquer comme supprimé
    const { error } = await supabase
      .from('messages')
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
        text: '', // Vider le texte
        attachments: null, // Supprimer les attachments
      })
      .eq('id', messageId);

    if (error) {
      console.error('Erreur lors de la suppression du message:', error);
      return false;
    }

    return true;
  },

  /**
   * Supprimer un thread (soft delete)
   */
  deleteThread: async (threadId: string, userId: string): Promise<boolean> => {
    const supabase = createClient();
    
    // Vérifier si userId est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUUID) {
      return false;
    }

    // Récupérer le thread pour vérifier les participants
    const { data: thread } = await supabase
      .from('message_threads')
      .select('participant_ids, deleted_by')
      .eq('id', threadId)
      .single();

    if (!thread) {
      return false;
    }

    const participantIds = thread.participant_ids as string[];
    if (!participantIds.includes(userId)) {
      return false;
    }

    // Ajouter l'utilisateur à deleted_by
    const deletedBy = (thread.deleted_by as string[]) || [];
    const updatedDeletedBy = deletedBy.includes(userId) 
      ? deletedBy 
      : [...deletedBy, userId];

    const { error } = await supabase
      .from('message_threads')
      .update({
        deleted_by: updatedDeletedBy,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', threadId);

    if (error) {
      console.error('Erreur lors de la suppression du thread:', error);
      return false;
    }

    return true;
  },
};
