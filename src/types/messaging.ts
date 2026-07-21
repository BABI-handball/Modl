export interface ParticipantSummary {
  id: string;
  name: string;
  role: 'MODEL' | 'BRAND' | 'PHOTOGRAPHER';
  avatarUrl?: string;
}

export interface LastMessage {
  text: string;
  createdAt: Date;
  fromId: string;
}

export interface Thread {
  id: string;
  participantIds: string[]; // 2 personnes pour MVP
  participantSummaries: ParticipantSummary[];
  lastMessage?: LastMessage;
  createdAt: Date;
  updatedAt: Date;
  listingId?: string; // Optionnel : pour les threads liés à une annonce
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'image' | 'document' | 'contract';
  size?: number; // en bytes
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

export interface MessageReply {
  messageId: string; // ID du message auquel on répond
  text?: string; // Texte du message original (pour prévisualisation)
  fromId: string; // ID de l'auteur du message original
}

export interface Message {
  id: string;
  threadId: string;
  fromId: string;
  text: string;
  attachments?: Attachment[];
  createdAt: Date;
  status: 'sent' | 'read';
  reactions?: MessageReaction[];
  replyTo?: MessageReply;
  deleted?: boolean; // Si le message a été supprimé
}

export interface ThreadWithDetails extends Thread {
  otherParticipant: {
    id: string;
    name: string;
    role: 'MODEL' | 'BRAND' | 'PHOTOGRAPHER';
    avatarUrl?: string;
  };
  listing: {
    id: string;
    title: string;
    city: string;
    payAmount: number | null;
    payType: 'PAID' | 'UNPAID';
    date: Date;
  };
  lastMessage?: Message;
}
