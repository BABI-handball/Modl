import { Thread, Message, ThreadWithDetails } from '@/src/types/messaging';
import { JobPost } from '@/src/types';
import { mockJobPosts } from '@/src/data/mock';
import { jobsStore } from './jobs';
import { mockModelProfiles, mockBrandProfiles, mockPhotographerProfiles } from '@/src/data/mock';
import { messagesStore } from './messagesStore';

const THREADS_STORAGE_KEY = 'modl_threads';
const MESSAGES_STORAGE_KEY = 'modl_messages';

// Récupérer tous les threads
export const getThreads = (): Thread[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(THREADS_STORAGE_KEY);
    if (!stored) return [];
    const threads = JSON.parse(stored);
    return threads.map((t: any) => ({
      ...t,
      lastMessageAt: new Date(t.lastMessageAt),
      createdAt: new Date(t.createdAt),
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
export const getMessages = (): Message[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!stored) return [];
    const messages = JSON.parse(stored);
    return messages.map((m: any) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    }));
  } catch {
    return [];
  }
};

// Sauvegarder les messages
const saveMessages = (messages: Message[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
};

// Créer un thread si nécessaire (quand un recruteur like un candidat)
export const createThreadIfNeeded = (
  recruiterId: string,
  modelId: string,
  listingId: string
): Thread | null => {
  const listing = [...mockJobPosts, ...jobsStore.getAll()].find((j) => j.id === listingId);
  const initialMessage = `Bonjour ! Votre profil nous intéresse pour "${listing?.title || 'cette annonce'}". Seriez-vous disponible pour en discuter ?`;
  
  const threadId = messagesStore.getOrCreateThread(recruiterId, modelId, listingId, initialMessage);
  return messagesStore.getThreadById(threadId, recruiterId);
};

// Envoyer un message (legacy - utiliser messagesStore.sendMessage)
export const sendMessage = (threadId: string, senderId: string, text: string): Message => {
  const messages = getMessages();
  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    threadId,
    fromId: senderId,
    text: text.trim(),
    createdAt: new Date(),
    status: 'sent',
  };

  messages.push(newMessage);
  saveMessages(messages);

  // Mettre à jour le thread
  const threads = getThreads();
  const threadIndex = threads.findIndex((t) => t.id === threadId);
  if (threadIndex !== -1) {
    const now = new Date();
    threads[threadIndex].updatedAt = now;
    threads[threadIndex].lastMessage = {
      text: newMessage.text,
      createdAt: newMessage.createdAt,
      fromId: newMessage.fromId,
    };
    saveThreads(threads);
  }

  return newMessage;
};

// Marquer un thread comme lu
export const markThreadAsRead = (threadId: string, userId: string): void => {
  messagesStore.markRead(threadId, userId);
};

// Récupérer les messages d'un thread
export const getMessagesByThreadId = (threadId: string): Message[] => {
  const messages = getMessages();
  return messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
};

// Récupérer les threads d'un utilisateur avec détails
export const getThreadsWithDetails = (userId: string): ThreadWithDetails[] => {
  const threads = getThreads();
  const messages = getMessages();
  const allJobs = [...mockJobPosts, ...jobsStore.getAll()];

  const result: ThreadWithDetails[] = [];

  threads
    .filter((t) => t.participantIds.includes(userId))
    .forEach((thread) => {
      const otherParticipantId = thread.participantIds.find((id) => id !== userId);
      if (!otherParticipantId) return;

      // Trouver le profil de l'autre participant
      let otherParticipant: ThreadWithDetails['otherParticipant'] | null = null;
      
      const modelProfile = mockModelProfiles.find((p) => p.userId === otherParticipantId);
      if (modelProfile) {
        otherParticipant = {
          id: modelProfile.userId,
          name: modelProfile.name,
          role: 'MODEL',
          avatarUrl: modelProfile.portfolioImages[0],
        };
      } else {
        const brandProfile = mockBrandProfiles.find((p) => p.userId === otherParticipantId);
        if (brandProfile) {
          otherParticipant = {
            id: brandProfile.userId,
            name: brandProfile.companyName,
            role: 'BRAND',
          };
        } else {
          const photographerProfile = mockPhotographerProfiles.find((p) => p.userId === otherParticipantId);
          if (photographerProfile) {
            otherParticipant = {
              id: photographerProfile.userId,
              name: photographerProfile.name,
              role: 'PHOTOGRAPHER',
              avatarUrl: photographerProfile.portfolioImages[0],
            };
          }
        }
      }

      // Si pas de profil trouvé, créer un profil par défaut
      if (!otherParticipant) {
        otherParticipant = {
          id: otherParticipantId,
          name: 'Utilisateur',
          role: 'MODEL',
        };
      }

      // Trouver l'annonce
      const listing = allJobs.find((j) => j.id === thread.listingId);
      if (!listing) return;

      // Dernier message
      const threadMessages = messages.filter((m) => m.threadId === thread.id);
      const lastMessage = threadMessages.length > 0
        ? threadMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : undefined;

      result.push({
        ...thread,
        otherParticipant,
        listing: {
          id: listing.id,
          title: listing.title,
          city: listing.location.split(',')[0].trim(),
          payAmount: listing.payAmount,
          payType: listing.payType,
          date: listing.date,
        },
        lastMessage,
      });
    });

  return result.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.createdAt;
    const bTime = b.lastMessage?.createdAt || b.createdAt;
    return bTime.getTime() - aTime.getTime();
  });
};
