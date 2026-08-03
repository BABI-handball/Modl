'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { messagesStore } from '@/src/lib/messagesStore';
import { Thread, Message, Attachment } from '@/src/types/messaging';
import { ChatBubble } from '@/src/components/messaging/ChatBubble';
import { DateSeparator } from '@/src/components/messaging/DateSeparator';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { formatDateSeparator, formatRelativeTime } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import Link from 'next/link';
import { EmojiPicker } from '@/src/components/ui/EmojiPicker';
import { MessageReply } from '@/src/types/messaging';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useRequireUser();
  const threadId = (typeof params.threadId === 'string' ? params.threadId : params.threadId?.[0]) || '';
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadThread = useCallback(() => {
    if (!user || !threadId || !isMountedRef.current) return;
    
    const foundThread = messagesStore.getThreadById(threadId, user.id);
    if (!foundThread) {
      if (isMountedRef.current) {
        router.push('/messages');
      }
      return;
    }
    
    if (isMountedRef.current) {
      setThread(foundThread);
      const threadMessages = messagesStore.getMessagesByThread(threadId);
      setMessages(threadMessages);
      messagesStore.markRead(threadId, user.id);
    }
  }, [threadId, user?.id, router]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Si le thread local est aligné sur un ID Supabase, suivre la navigation
  useEffect(() => {
    const onMigrated = (event: Event) => {
      const detail = (event as CustomEvent<{ fromId: string; toId: string }>).detail;
      if (!detail || detail.fromId !== threadId) return;
      router.replace(`/messages/${detail.toId}`);
    };
    window.addEventListener('threadMigrated', onMigrated);
    return () => window.removeEventListener('threadMigrated', onMigrated);
  }, [threadId, router]);

  // Auto-scroll en bas
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]);

  // Rafraîchir les messages périodiquement
  useEffect(() => {
    if (!threadId || !user || !thread || !isMountedRef.current) return;
    
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      loadThread();
    }, 2000);

    return () => clearInterval(interval);
  }, [threadId, user?.id, thread?.id, loadThread]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Déterminer le type de fichier
      let fileType: 'file' | 'image' | 'document' | 'contract' = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
        fileType = 'document';
      } else if (file.name.toLowerCase().includes('contract') || file.name.toLowerCase().includes('contrat')) {
        fileType = 'contract';
      }

      const newAttachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        // Blob URL: plus fiable à l'ouverture et beaucoup plus léger que base64 en localStorage
        url: URL.createObjectURL(file),
        type: fileType,
        size: file.size,
      };

      setAttachments((prev) => [...prev, newAttachment]);
    });

    // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
    setShowImportMenu(false);
  };

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowImportMenu(false);
      }
    };

    if (showImportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showImportMenu]);

  const handleRemoveAttachment = (attachmentId: string) => {
    const attachment = attachments.find((att) => att.id === attachmentId);
    if (attachment?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url);
    }
    setAttachments(attachments.filter(att => att.id !== attachmentId));
  };

  // Gérer le typing indicator pour l'utilisateur actuel
  // (Dans un vrai système, on enverrait ce signal au serveur pour que l'autre personne le voie)
  useEffect(() => {
    if (messageText.trim() && !isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsTyping(false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, isTyping]);

  // L'indicateur "en train d'écrire" de l'autre utilisateur
  // Dans un vrai système, cela viendrait du serveur via WebSocket
  // Pour l'instant, on ne simule pas automatiquement pour éviter les bugs
  // setOtherIsTyping sera mis à jour quand on recevra un vrai signal de l'autre personne

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && attachments.length === 0) || isSending || !user || !threadId) return;

    setIsSending(true);
    setIsTyping(false);
    try {
      const replyTo: MessageReply | undefined = replyingTo ? {
        messageId: replyingTo.id,
        text: replyingTo.text,
        fromId: replyingTo.fromId,
      } : undefined;

      messagesStore.sendMessage(
        threadId,
        messageText.trim(),
        user.id,
        attachments.length > 0 ? attachments : undefined,
        replyTo
      );
      setMessageText('');
      setAttachments([]);
      setReplyingTo(null);
      loadThread(); // Rafraîchir immédiatement
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <div className="mt-4 text-neutral-600 font-medium">Chargement de la conversation...</div>
      </div>
    );
  }

  if (!user || !thread) {
    return null;
  }

  const otherParticipant = thread.participantSummaries.find((p) => p.id !== user.id);
  if (!otherParticipant) {
    router.push('/messages');
    return null;
  }

  let lastDate: Date | null = null;

  return (
    <div className="flex h-screen flex-col bg-beige-50">
      {/* Header moderne */}
      <div className="sticky top-0 z-10 border-b-2 border-beige-200 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-3 sm:py-4 shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-110 rounded-full p-1.5 sm:p-2 hover:bg-gray-100"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {otherParticipant.avatarUrl ? (
            <img
              src={otherParticipant.avatarUrl}
              alt={otherParticipant.name}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl object-cover flex-shrink-0 ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-black text-white font-bold text-base sm:text-lg flex-shrink-0 shadow-lg">
              {otherParticipant.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{otherParticipant.name}</h2>
              <Badge variant="primary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                {otherParticipant.role === 'MODEL' ? 'Modèle' : otherParticipant.role === 'BRAND' ? 'Marque' : 'Photographe'}
              </Badge>
            </div>
            <Link href={`/profile/${otherParticipant.id}`} className="text-[10px] sm:text-xs text-violet-600 hover:text-violet-700 hover:underline">
              Voir le profil
            </Link>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="mx-auto flex max-w-6xl flex-col">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">Aucun message pour le moment</p>
              <p className="text-gray-400 text-xs mt-1">Envoyez le premier message pour commencer la conversation</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDateSeparator = !lastDate || message.createdAt.toDateString() !== lastDate.toDateString();
              if (showDateSeparator) {
                lastDate = message.createdAt;
              }
              
              // Vérifier si c'est un message consécutif du même expéditeur
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const isConsecutive = Boolean(
                previousMessage &&
                  previousMessage.fromId === message.fromId &&
                  (message.createdAt.getTime() - previousMessage.createdAt.getTime()) < 120000
              ); // 2 minutes
              
              // Vérifier si le message suivant est de la même minute (même expéditeur)
              // On vérifie seulement la minute, pas l'heure, pour regrouper les messages de la même minute
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
              const sameMinute = Boolean(
                nextMessage &&
                  message.fromId === nextMessage.fromId &&
                  message.createdAt.getMinutes() === nextMessage.createdAt.getMinutes() &&
                  message.createdAt.toDateString() === nextMessage.createdAt.toDateString() &&
                  (nextMessage.createdAt.getTime() - message.createdAt.getTime()) < 60000
              ); // Moins d'une minute
              
              // Trouver le message original si c'est une réponse
              const originalMessage = message.replyTo 
                ? messages.find(m => m.id === message.replyTo?.messageId)
                : undefined;
              return (
                <div key={message.id}>
                  {showDateSeparator && <DateSeparator date={message.createdAt} />}
                  <ChatBubble 
                    message={message} 
                    isSender={message.fromId === user.id}
                    onReply={handleReply}
                    originalMessage={originalMessage}
                    onReaction={loadThread}
                    isConsecutive={isConsecutive}
                    sameMinute={sameMinute}
                    onDelete={loadThread}
                  />
                </div>
              );
            })
          )}
          {/* Indicateur "en train d'écrire" */}
          {otherIsTyping && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span>{otherParticipant.name} est en train d'écrire...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-3 sm:px-4 py-2 sm:py-3">
        <div className="mx-auto max-w-6xl">
          {/* Message auquel on répond */}
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-beige-50 border-2 border-beige-200 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-700 mb-0.5">Répondre à</p>
                <p className="text-xs text-neutral-600 truncate">{replyingTo.text || '📎 Pièce jointe'}</p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Pièces jointes sélectionnées */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 rounded-lg bg-beige-100 px-3 py-2 text-sm"
                >
                  <svg className="h-4 w-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium text-neutral-700">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
            <input
              ref={galleryInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
              capture="environment"
            />
            <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImportMenu(!showImportMenu)}
                className="flex-shrink-0 border-beige-300 hover:bg-beige-100 p-2 sm:p-2.5"
                title="Ajouter une pièce jointe"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </Button>
              
              {showImportMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-white border-2 border-beige-200 shadow-lg overflow-hidden z-20">
                  <button
                    type="button"
                    onClick={() => {
                      galleryInputRef.current?.click();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-beige-50 transition-colors flex items-center gap-3 text-sm font-medium text-neutral-700"
                  >
                    <svg className="h-5 w-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Galerie
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-beige-50 transition-colors flex items-center gap-3 text-sm font-medium text-neutral-700 border-t border-beige-100"
                  >
                    <svg className="h-5 w-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ordinateur
                  </button>
                </div>
              )}
            </div>
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              className="flex-1 text-sm sm:text-base"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={(!messageText.trim() && attachments.length === 0) || isSending}
              className="flex-shrink-0 p-2 sm:p-2.5"
            >
              {isSending ? (
                <svg className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </form>
        </div>
      </div>

    </div>
  );
}
