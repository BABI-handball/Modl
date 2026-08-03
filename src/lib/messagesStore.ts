'use client';

import { Thread, Message, ParticipantSummary, LastMessage, Attachment } from '@/src/types/messaging';
import { userStore } from './userStore';
import { mockModelProfiles, mockBrandProfiles, mockPhotographerProfiles } from '@/src/data/mock';
import { jobsStore } from './jobs';
import { mockJobPosts } from '@/src/data/mock';
import { messagesStoreSupabase } from './messagesSupabase';

const THREADS_STORAGE_KEY = 'modl_threads_v2';
const MESSAGES_STORAGE_KEY = 'modl_messages_v2';
let inMemoryMessagesCache: Message[] | null = null;

// Helper pour obtenir un ParticipantSummary depuis un userId
const getParticipantSummary = (userId: string): ParticipantSummary | null => {
  // Chercher dans les profils du store
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

// Récupérer tous les threads
const getThreads = (): Thread[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(THREADS_STORAGE_KEY);
    if (!stored) return [];
    const threads = JSON.parse(stored);
    return threads.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      lastMessage: t.lastMessage ? {
        ...t.lastMessage,
        createdAt: new Date(t.lastMessage.createdAt),
      } : undefined,
    }));
  } catch {
    return [];
  }
};

// Sauvegarder les threads
const saveThreads = (threads: Thread[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  } catch (error) {
    console.error('Error saving threads:', error);
  }
};

// Récupérer tous les messages
const getMessages = (): Message[] => {
  if (typeof window === 'undefined') return [];
  if (inMemoryMessagesCache) {
    return inMemoryMessagesCache.map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
  }
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!stored) return [];
    const messages = JSON.parse(stored);
    const parsed = messages.map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
    inMemoryMessagesCache = parsed;
    return parsed;
  } catch {
    return [];
  }
};

// Sauvegarder les messages
const saveMessages = (messages: Message[]): void => {
  if (typeof window === 'undefined') return;
  // Toujours garder une copie en mémoire pour préserver les pièces jointes
  // même si le localStorage est saturé.
  inMemoryMessagesCache = messages;
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    // Fallback: on n'écrase pas les URLs des pièces jointes.
    // Le cache mémoire garde les messages fonctionnels pendant la session.
    console.error('Error saving messages:', error);
    console.warn('⚠️ Quota localStorage atteint. Les messages restent disponibles en session.');
  }
};

const areMessagesEquivalent = (a: Message, b: Message): boolean => {
  if (a.threadId !== b.threadId) return false;
  if (a.fromId !== b.fromId) return false;

  const textA = (a.text || '').trim();
  const textB = (b.text || '').trim();
  if (textA !== textB) return false;

  const timeDiff = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (timeDiff > 15000) return false;

  const aAttachments = a.attachments || [];
  const bAttachments = b.attachments || [];
  if (aAttachments.length !== bAttachments.length) return false;

  return true;
};

export const messagesStore = {
  // Récupérer ou créer un thread entre deux participants
  getOrCreateThread: (participantAId: string, participantBId: string, listingId?: string, initialMessage?: string): string => {
    const threads = getThreads();
    
    // Chercher un thread existant entre ces deux participants
    const existingThread = threads.find(
      (t) =>
        t.participantIds.includes(participantAId) &&
        t.participantIds.includes(participantBId) &&
        (!listingId || t.listingId === listingId)
    );

    if (existingThread) {
      // Synchroniser avec Supabase en arrière-plan (sans message initial car le thread existe déjà)
      messagesStoreSupabase.getOrCreateThread(participantAId, participantBId, listingId)
        .then((supabaseThreadId) => {
          if (supabaseThreadId) {
            // Thread synchronisé avec Supabase
          }
        })
        .catch((error) => {
          // Ne pas logger pour les comptes dev
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMsg = String(error.message);
            if (!errorMsg.includes('UUID') && !errorMsg.includes('uuid')) {
              console.warn('⚠️ Échec de la synchronisation Supabase du thread:', error);
            }
          }
        });
      
      return existingThread.id;
    }

    // Créer un nouveau thread — même ID local + Supabase
    const participantA = getParticipantSummary(participantAId);
    const participantB = getParticipantSummary(participantBId);

    if (!participantA || !participantB) {
      throw new Error('Cannot create thread: participant not found');
    }

    const sharedId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `thread-${crypto.randomUUID()}`
        : `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const now = new Date();
    const newThread: Thread = {
      id: sharedId,
      participantIds: [participantAId, participantBId],
      participantSummaries: [participantA, participantB],
      createdAt: now,
      updatedAt: now,
      listingId,
    };

    threads.push(newThread);
    saveThreads(threads);

    // Sauvegarder dans Supabase avec le même ID
    messagesStoreSupabase
      .getOrCreateThread(participantAId, participantBId, listingId, initialMessage, sharedId)
      .then((supabaseThreadId) => {
        if (supabaseThreadId && supabaseThreadId !== sharedId) {
          // Thread déjà existant côté serveur : migrer l'ID local
          messagesStore.migrateThreadId(sharedId, supabaseThreadId);
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la création Supabase du thread:', error);
      });

    if (initialMessage) {
      const existingMessages = getMessages();
      const similarMessage = existingMessages.find(
        (m) =>
          m.threadId === newThread.id &&
          m.fromId === participantAId &&
          m.text.includes(initialMessage.substring(0, 20))
      );

      if (!similarMessage) {
        messagesStore.sendMessage(newThread.id, initialMessage, participantAId);
      }
    }

    return newThread.id;
  },

  /** Réécrit un thread + ses messages vers un autre ID (alignement Supabase). */
  migrateThreadId: (fromId: string, toId: string): void => {
    if (fromId === toId) return;
    const threads = getThreads();
    const messages = getMessages();

    const updatedThreads = threads
      .filter((t) => t.id !== toId)
      .map((t) => (t.id === fromId ? { ...t, id: toId } : t));
    saveThreads(updatedThreads);

    const updatedMessages = messages.map((m) =>
      m.threadId === fromId ? { ...m, threadId: toId } : m
    );
    saveMessages(updatedMessages);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('threadMigrated', { detail: { fromId, toId } })
      );
    }
  },

  // Envoyer un message
  sendMessage: (threadId: string, text: string, fromId: string, attachments?: Attachment[], replyTo?: Message['replyTo']): Message => {
    const messages = getMessages();
    const threads = getThreads();
    
    // Vérifier qu'un message identique n'existe pas déjà (éviter les doublons)
    const existingMessage = messages.find(
      m => m.threadId === threadId && 
           m.fromId === fromId && 
           m.text === text.trim() &&
           Math.abs(m.createdAt.getTime() - Date.now()) < 5000 // Moins de 5 secondes de différence
    );
    
    if (existingMessage) {
      console.warn('⚠️ Message dupliqué détecté, utilisation du message existant:', existingMessage.id);
      return existingMessage;
    }
    
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      threadId,
      fromId,
      text: text.trim(),
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      createdAt: new Date(),
      status: 'sent',
      replyTo: replyTo,
    };

    // Vérifier qu'on n'ajoute pas un doublon par ID
    if (!messages.some(m => m.id === newMessage.id)) {
      messages.push(newMessage);
      saveMessages(messages);
    } else {
      console.warn('⚠️ Message avec cet ID existe déjà:', newMessage.id);
      return messages.find(m => m.id === newMessage.id)!;
    }

    // Mettre à jour le thread
    const threadIndex = threads.findIndex((t) => t.id === threadId);
    if (threadIndex !== -1) {
      const now = new Date();
      const lastMessageText = newMessage.attachments && newMessage.attachments.length > 0
        ? `${newMessage.text || '📎 Pièce jointe'}`
        : newMessage.text;
      threads[threadIndex].updatedAt = now;
      threads[threadIndex].lastMessage = {
        text: lastMessageText,
        createdAt: newMessage.createdAt,
        fromId: newMessage.fromId,
      };
      saveThreads(threads);
    }

    // Sauvegarder dans Supabase — même ID de thread si possible
    const thread = threads.find(t => t.id === threadId);
    if (thread && thread.participantIds.length >= 2) {
      messagesStoreSupabase.getOrCreateThread(
        thread.participantIds[0],
        thread.participantIds[1],
        thread.listingId,
        undefined,
        threadId
      ).then((supabaseThreadId) => {
        const targetId = supabaseThreadId || threadId;
        if (supabaseThreadId && supabaseThreadId !== threadId) {
          messagesStore.migrateThreadId(threadId, supabaseThreadId);
        }
        return messagesStoreSupabase.sendMessage(targetId, text, fromId, attachments, replyTo);
      }).catch((error) => {
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMsg = String(error.message);
          if (!errorMsg.includes('UUID') && !errorMsg.includes('uuid')) {
            console.error('Échec de l\'envoi Supabase du message:', error);
          }
        }
      });
    } else {
      messagesStoreSupabase.sendMessage(threadId, text, fromId, attachments, replyTo).catch(() => {});
    }

    return newMessage;
  },

  // Marquer les messages d'un thread comme lus
  markRead: (threadId: string, userId: string): void => {
    const messages = getMessages();
    const threadMessages = messages.filter((m) => m.threadId === threadId && m.fromId !== userId);
    
    threadMessages.forEach((msg) => {
      msg.status = 'read';
    });

    saveMessages(messages);

    // Marquer comme lu dans Supabase en arrière-plan
    messagesStoreSupabase.markRead(threadId, userId)
      .then((success) => {
        if (success) {
          console.log('✅ Messages marqués comme lus dans Supabase');
        }
      })
      .catch((error) => {
        // Ne pas logger l'erreur si c'est juste un compte dev (UUID invalide) ou thread non synchronisé
        if (error && typeof error === 'object') {
          const errorMsg = error.message ? String(error.message) : String(error);
          if (!errorMsg.includes('UUID') && !errorMsg.includes('uuid') && errorMsg !== '{}' && errorMsg !== '[object Object]') {
            console.warn('⚠️ Échec du marquage Supabase comme lu:', error);
          }
        } else if (error && String(error) !== '{}' && String(error) !== '[object Object]') {
          console.warn('⚠️ Échec du marquage Supabase comme lu:', error);
        }
      });
  },

  // Récupérer les threads d'un utilisateur
  getThreadsForUser: (userId: string): Thread[] => {
    const threads = getThreads();
    const userThreads = threads
      .filter((t) => t.participantIds.includes(userId))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    // Charger depuis Supabase en arrière-plan pour synchroniser
    setTimeout(async () => {
      try {
        const supabaseThreads = await messagesStoreSupabase.getThreadsForUser(userId);
        
        // Créer une fonction pour générer une clé unique basée sur les participants
        const getThreadKey = (thread: Thread): string => {
          const sortedParticipants = [...thread.participantIds].sort().join(',');
          return sortedParticipants;
        };
        
        // Fusionner avec les threads locaux (priorité aux locaux)
        const threadsByIdMap = new Map<string, Thread>();
        const threadsByParticipantsMap = new Map<string, Thread>();
        
        // Ajouter d'abord les threads locaux
        userThreads.forEach(thread => {
          threadsByIdMap.set(thread.id, thread);
          const key = getThreadKey(thread);
          if (!threadsByParticipantsMap.has(key)) {
            threadsByParticipantsMap.set(key, thread);
          }
        });
        
        // Ajouter les threads Supabase (dédupliquer par participants)
        supabaseThreads.forEach(thread => {
          const participantsKey = getThreadKey(thread);
          
          // Si un thread avec les mêmes participants existe déjà (local ou Supabase), ne pas l'ajouter
          if (!threadsByParticipantsMap.has(participantsKey)) {
            threadsByIdMap.set(thread.id, thread);
            threadsByParticipantsMap.set(participantsKey, thread);
            // Sauvegarder dans localStorage
            const allThreads = getThreads();
            allThreads.push(thread);
            saveThreads(allThreads);
          } else {
            // Thread avec mêmes participants existe déjà, mettre à jour l'ID local si nécessaire
            const existingThread = threadsByParticipantsMap.get(participantsKey);
            if (existingThread && existingThread.id !== thread.id) {
              messagesStore.migrateThreadId(existingThread.id, thread.id);
            }
          }
        });
      } catch (error) {
        console.warn('Chargement Supabase des threads échoué, utilisation des données locales');
      }
    }, 2000);
    
    // Dédupliquer les threads retournés par participants
    const threadsByParticipants = new Map<string, Thread>();
    userThreads.forEach(thread => {
      const key = [...thread.participantIds].sort().join(',');
      if (!threadsByParticipants.has(key)) {
        threadsByParticipants.set(key, thread);
      } else {
        // Garder le thread le plus récent
        const existing = threadsByParticipants.get(key)!;
        if (thread.updatedAt > existing.updatedAt) {
          threadsByParticipants.set(key, thread);
        }
      }
    });
    
    return Array.from(threadsByParticipants.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  // Récupérer les messages d'un thread (inclut les messages supprimés pour afficher "Ce message a été supprimé")
  getMessagesByThread: (threadId: string): Message[] => {
    const messages = getMessages();
    const threadMessages = messages
      .filter((m) => m.threadId === threadId) // Inclure tous les messages, même supprimés
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Filtrer les doublons par ID pour éviter les clés React dupliquées
    const uniqueMessages = Array.from(
      new Map(threadMessages.map(msg => [msg.id, msg])).values()
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Charger depuis Supabase en arrière-plan pour synchroniser
    setTimeout(async () => {
      try {
        const supabaseMessages = await messagesStoreSupabase.getMessagesByThread(threadId);
        
        // Fusionner avec les messages locaux (priorité aux locaux)
        const messagesMap = new Map<string, Message>();
        
        // Ajouter d'abord les messages locaux
        uniqueMessages.forEach(msg => {
          messagesMap.set(msg.id, msg);
        });
        
        // Ajouter les messages Supabase (complètent mais n'écrasent pas)
        supabaseMessages.forEach(msg => {
          const duplicateLocalMessage = Array.from(messagesMap.values()).find((localMsg) =>
            areMessagesEquivalent(localMsg, msg)
          );

          if (!messagesMap.has(msg.id) && !duplicateLocalMessage) {
            messagesMap.set(msg.id, msg);
            // Sauvegarder dans localStorage
            const allMessages = getMessages();
            // Vérifier qu'on n'ajoute pas un doublon
            const alreadyPresent = allMessages.some((m) => m.id === msg.id);
            const alreadyPresentEquivalent = allMessages.some((m) => areMessagesEquivalent(m, msg));
            if (!alreadyPresent && !alreadyPresentEquivalent) {
              allMessages.push(msg);
              saveMessages(allMessages);
            }
          }
        });
      } catch (error) {
        console.warn('Chargement Supabase des messages échoué, utilisation des données locales');
      }
    }, 2000);
    
    return uniqueMessages;
  },

  // Ajouter ou retirer une réaction
  toggleReaction: (messageId: string, emoji: string, userId: string): void => {
    const messages = getMessages();
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    
    if (messageIndex === -1) return;
    
    const message = messages[messageIndex];
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Vérifier si l'utilisateur a déjà réagi avec cet emoji
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId === userId
    );
    
    if (existingReactionIndex !== -1) {
      // Retirer la réaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Ajouter la réaction
      message.reactions.push({
        emoji,
        userId,
        createdAt: new Date(),
      });
    }
    
    saveMessages(messages);
    
    // Synchroniser avec Supabase en arrière-plan
    messagesStoreSupabase.toggleReaction(messageId, emoji, userId).catch((error) => {
      // Ne pas logger si c'est juste un message local ou un compte dev
      const errorMsg = error?.message || String(error || '');
      if (errorMsg && errorMsg !== '{}' && errorMsg !== '[object Object]' && !errorMsg.includes('UUID')) {
        console.warn('Échec de la synchronisation Supabase de la réaction:', error);
      }
    });
  },

  // Supprimer un message (marquer comme supprimé)
  deleteMessage: (messageId: string, userId: string): void => {
    const messages = getMessages();
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    
    if (messageIndex === -1) return;
    
    const message = messages[messageIndex];
    
    // Vérifier que l'utilisateur est bien l'auteur du message
    if (message.fromId !== userId) return;
    
    // Marquer le message comme supprimé au lieu de le supprimer complètement
    message.deleted = true;
    message.text = '';
    message.attachments = [];
    
    saveMessages(messages);
    
    // Synchroniser avec Supabase en arrière-plan
    messagesStoreSupabase.deleteMessage(messageId, userId).catch((error) => {
      console.warn('Échec de la synchronisation Supabase de la suppression:', error);
    });
    
    // Mettre à jour le lastMessage du thread
    const threads = getThreads();
    const threadIndex = threads.findIndex((t) => t.id === message.threadId);
    if (threadIndex !== -1) {
      // Trouver tous les messages du thread pour vérifier si le message supprimé était le dernier
      const allThreadMessages = messages
        .filter((m) => m.threadId === message.threadId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const wasLastMessage = allThreadMessages.length > 0 && 
        allThreadMessages[0].id === message.id;
      
      if (wasLastMessage) {
        // Le message supprimé était le dernier, mettre à jour le lastMessage
        threads[threadIndex].lastMessage = {
          text: 'Ce message a été supprimé',
          createdAt: message.createdAt,
          fromId: message.fromId,
        };
        saveThreads(threads);
      } else {
        // Ce n'était pas le dernier message, trouver le dernier message non supprimé
        const threadMessages = messages
          .filter((m) => m.threadId === message.threadId && !m.deleted)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        if (threadMessages.length > 0) {
          const lastNonDeletedMessage = threadMessages[0];
          const lastMessageText = lastNonDeletedMessage.attachments && lastNonDeletedMessage.attachments.length > 0
            ? `${lastNonDeletedMessage.text || '📎 Pièce jointe'}`
            : lastNonDeletedMessage.text;
          threads[threadIndex].lastMessage = {
            text: lastMessageText,
            createdAt: lastNonDeletedMessage.createdAt,
            fromId: lastNonDeletedMessage.fromId,
          };
          saveThreads(threads);
        }
      }
    }
  },

  // Récupérer un thread par ID
  getThreadById: (threadId: string, userId: string): Thread | null => {
    const threads = getThreads();
    const thread = threads.find((t) => t.id === threadId && t.participantIds.includes(userId));
    return thread || null;
  },

  // Helper: obtenir un aperçu du thread
  getThreadPreview: (threadId: string, userId: string): { otherParticipant: ParticipantSummary | null; lastMessage?: LastMessage; unreadCount: number } => {
    const thread = messagesStore.getThreadById(threadId, userId);
    if (!thread) {
      return { otherParticipant: null, unreadCount: 0 };
    }

    const otherParticipant = thread.participantSummaries.find((p) => p.id !== userId) || null;
    const messages = messagesStore.getMessagesByThread(threadId);
    const unreadCount = messages.filter((m) => m.fromId !== userId && m.status === 'sent' && !m.deleted).length;

    let lastMessage: LastMessage | undefined;
    
    // Vérifier d'abord si le lastMessage du thread indique qu'un message a été supprimé
    if (thread.lastMessage?.text === 'Ce message a été supprimé') {
      // Le lastMessage indique déjà qu'un message a été supprimé
      lastMessage = thread.lastMessage;
    } else {
      // Vérifier si le dernier message chronologique du thread a été supprimé
      const allMessages = getMessages();
      const allThreadMessages = allMessages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const lastChronologicalMessage = allThreadMessages.length > 0 ? allThreadMessages[0] : null;
      
      if (lastChronologicalMessage?.deleted) {
        // Le dernier message chronologique a été supprimé, afficher "Ce message a été supprimé"
        lastMessage = {
          text: 'Ce message a été supprimé',
          createdAt: lastChronologicalMessage.createdAt,
          fromId: lastChronologicalMessage.fromId,
        };
      } else {
        // Le dernier message n'est pas supprimé, trouver le dernier message non supprimé
        const nonDeletedMessages = messages.filter(m => !m.deleted);
        const lastNonDeletedMessage = nonDeletedMessages.length > 0 ? nonDeletedMessages[nonDeletedMessages.length - 1] : null;
        
        if (lastNonDeletedMessage) {
          // Il y a des messages non supprimés, utiliser le dernier
          lastMessage = {
            text: lastNonDeletedMessage.attachments && lastNonDeletedMessage.attachments.length > 0
              ? `${lastNonDeletedMessage.text || '📎 Pièce jointe'}`
              : lastNonDeletedMessage.text,
            createdAt: lastNonDeletedMessage.createdAt,
            fromId: lastNonDeletedMessage.fromId,
          };
        } else if (thread.lastMessage) {
          // Pas de messages non supprimés, utiliser le lastMessage du thread
          lastMessage = thread.lastMessage;
        }
        // Si thread.lastMessage est undefined et qu'il n'y a pas de messages, lastMessage reste undefined et on affichera "Aucun message"
      }
    }

    return {
      otherParticipant,
      lastMessage,
      unreadCount,
    };
  },

  // Créer un message initial automatique selon le contexte
  createInitialMessage: (threadId: string, fromId: string, toId: string, context?: { type: 'swipe' | 'application' | 'profile'; listingTitle?: string; participantName?: string }): void => {
    let messageText = '';

    if (context?.type === 'swipe' && context.listingTitle) {
      const fromProfile = getParticipantSummary(fromId);
      const toProfile = getParticipantSummary(toId);
      const fromName = fromProfile?.name || 'Nous';
      const toName = toProfile?.name || '';
      
      messageText = `Bonjour ${toName}, votre profil nous intéresse pour "${context.listingTitle}". Seriez-vous disponible pour échanger ?`;
    } else if (context?.type === 'application' && context.listingTitle) {
      const toProfile = getParticipantSummary(toId);
      const toName = toProfile?.name || '';
      
      messageText = `Bonjour ${toName}, nous avons accepté votre candidature pour "${context.listingTitle}". Serions ravis d'échanger avec vous !`;
    } else if (context?.type === 'profile') {
      const fromProfile = getParticipantSummary(fromId);
      const toProfile = getParticipantSummary(toId);
      const fromName = fromProfile?.name || 'Moi';
      const toName = toProfile?.name || '';
      
      messageText = `Bonjour ${toName}, je suis ${fromName}. J'aimerais en savoir plus sur votre profil.`;
    } else {
      messageText = 'Bonjour, j\'aimerais entrer en contact avec vous.';
    }

    messagesStore.sendMessage(threadId, messageText, fromId);
  },

  // Obtenir le nombre total de messages non lus pour un utilisateur
  getUnreadCount: (userId: string): number => {
    const threads = getThreads();
    const messages = getMessages();
    
    let totalUnread = 0;
    
    threads.forEach((thread) => {
      if (thread.participantIds.includes(userId)) {
        const threadMessages = messages.filter((m) => m.threadId === thread.id && m.fromId !== userId);
        const unreadMessages = threadMessages.filter((m) => m.status === 'sent');
        totalUnread += unreadMessages.length;
      }
    });
    
    return totalUnread;
  },

  // Supprimer un thread et tous ses messages
  deleteThread: (threadId: string, userId: string): void => {
    // Synchroniser avec Supabase en arrière-plan
    messagesStoreSupabase.deleteThread(threadId, userId).catch((error) => {
      console.warn('Échec de la synchronisation Supabase de la suppression du thread:', error);
    });
    
    if (typeof window === 'undefined') return;
    
    const threads = getThreads();
    const thread = threads.find((t) => t.id === threadId && t.participantIds.includes(userId));
    
    if (!thread) return;
    
    // Supprimer le thread
    const filteredThreads = threads.filter((t) => t.id !== threadId);
    saveThreads(filteredThreads);
    
    // Supprimer tous les messages du thread
    const messages = getMessages();
    const filteredMessages = messages.filter((m) => m.threadId !== threadId);
    saveMessages(filteredMessages);
  },
};
