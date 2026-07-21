'use client';

import { useState } from 'react';
import { Message } from '@/src/types/messaging';
import { cn } from '@/src/lib/utils';
import { detectUrls, isImageUrl, isOnlyEmoji } from '@/src/lib/messageUtils';
import { LinkPreview } from './LinkPreview';
import { messagesStore } from '@/src/lib/messagesStore';
import { useRequireUser } from '@/src/hooks/useRequireUser';

interface ChatBubbleProps {
  message: Message;
  isSender: boolean;
  onReply?: (message: Message) => void;
  originalMessage?: Message; // Message original si c'est une réponse
  onReaction?: () => void; // Callback pour recharger les messages après réaction
  isConsecutive?: boolean; // Si le message précédent est du même expéditeur et récent
  sameMinute?: boolean; // Si le message suivant est de la même minute
  onDelete?: () => void; // Callback après suppression
}

export const ChatBubble = ({ message, isSender, onReply, originalMessage, onReaction, isConsecutive = false, sameMinute = false, onDelete }: ChatBubbleProps) => {
  const { user } = useRequireUser();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleDelete = () => {
    if (!user) return;
    messagesStore.deleteMessage(message.id, user.id);
    setShowOptions(false);
    if (onDelete) {
      setTimeout(() => onDelete(), 100);
    }
  };

  const formatMessageTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleReaction = (emoji: string) => {
    if (!user) return;
    messagesStore.toggleReaction(message.id, emoji, user.id);
    setShowReactionPicker(false);
    setShowOptions(false);
    // Recharger les messages pour afficher la réaction
    if (onReaction) {
      setTimeout(() => onReaction(), 100);
    }
  };

  const quickReactions = ['👍', '❤️', '😄', '😮', '😢', '🔥'];

  // Grouper les réactions par emoji
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>) || {};

  const urls = message.text ? detectUrls(message.text) : [];
  const imageUrls = urls.filter(url => isImageUrl(url));
  const linkUrls = urls.filter(url => !isImageUrl(url));
  const onlyEmoji = message.text ? isOnlyEmoji(message.text) : false;

  const getFileIcon = (type: string) => {
    if (type === 'image') {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === 'contract' || type === 'document') {
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openAttachment = (attachment: NonNullable<Message['attachments']>[number]) => {
    if (!attachment.url) return;

    // Les URLs data: (base64) de PDFs peuvent ouvrir une page vide selon le navigateur.
    // On les convertit en Blob URL pour une ouverture fiable.
    if (attachment.url.startsWith('data:')) {
      try {
        const [meta, base64Data] = attachment.url.split(',');
        if (!meta || !base64Data) return;

        const mimeMatch = meta.match(/data:(.*?);base64/);
        const mimeType = mimeMatch?.[1] || 'application/octet-stream';
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        return;
      } catch {
        // Fallback ci-dessous
      }
    }

    window.open(attachment.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn(
      'flex w-full group', 
      isSender ? 'justify-end' : 'justify-start',
      isConsecutive ? 'mb-0.5' : 'mb-4'
    )}>
      <div className={cn(
        isSender ? 'items-end' : 'items-start', 
        'flex flex-col gap-1',
        onlyEmoji ? 'max-w-none' : 'max-w-[75%]'
      )}>
        {/* Message original si c'est une réponse */}
        {message.replyTo && originalMessage && (
          <div className={cn(
            'mb-1 px-3 py-2 rounded-lg border-l-2 text-xs',
            isSender 
              ? 'bg-neutral-100 border-neutral-400 text-neutral-800' 
              : 'bg-beige-50 border-beige-300 text-neutral-600'
          )}>
            <p className="font-semibold mb-0.5">
              {originalMessage.fromId === user?.id ? 'Vous' : 'Réponse à'}
            </p>
            <p className="truncate">{originalMessage.text || '📎 Pièce jointe'}</p>
          </div>
        )}

        <div
          className={cn(
            'text-sm shadow-md transition-all duration-200 relative',
            onlyEmoji
              ? 'px-2 py-2 rounded-2xl'
              : 'rounded-2xl px-4 py-3',
            isSender
              ? onlyEmoji
                ? 'bg-transparent'
                : 'bg-black text-white rounded-br-md'
              : onlyEmoji
                ? 'bg-transparent'
              : 'bg-white text-neutral-900 rounded-bl-md border-2 border-beige-200'
          )}
          onMouseEnter={() => setShowOptions(true)}
          onMouseLeave={() => {
            setShowOptions(false);
            setShowReactionPicker(false);
          }}
        >
          {/* Boutons d'action au hover */}
          {showOptions && (
            <div className={cn(
              'absolute flex items-center gap-1 bg-white border-2 border-beige-200 rounded-full px-2 py-1 shadow-lg z-10 transition-all duration-200 animate-scale-in',
              isSender 
                ? 'right-0 -top-11' 
                : 'left-0 -top-11'
            )}>
              {/* Réactions rapides */}
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-lg hover:scale-125 transition-transform p-1"
                  title={`Réagir avec ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              {/* Plus de réactions */}
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className={cn(
                  "text-sm px-2 py-1 hover:bg-beige-100 rounded-full transition-colors",
                  isSender && "text-neutral-700"
                )}
                title="Plus de réactions"
              >
                <svg className={cn("h-4 w-4", isSender ? "text-neutral-700" : "text-neutral-600")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              {/* Répondre */}
              {onReply && (
                <button
                  onClick={() => {
                    onReply(message);
                    setShowOptions(false);
                  }}
                  className={cn(
                    "text-xs px-2 py-1 hover:bg-beige-100 rounded-full transition-colors",
                    isSender && "text-neutral-700"
                  )}
                  title="Répondre"
                >
                  <svg className={cn("h-4 w-4", isSender ? "text-neutral-700" : "text-neutral-600")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
              {/* Supprimer (seulement pour ses propres messages) */}
              {isSender && !message.deleted && (
                <button
                  onClick={handleDelete}
                  className={cn(
                    "text-xs px-2 py-1 hover:bg-red-50 rounded-full transition-colors text-red-600 hover:text-red-700"
                  )}
                  title="Supprimer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Message supprimé ou contenu normal */}
          {message.deleted ? (
            <div className={cn(
              'text-xs italic text-neutral-400 px-2 py-1',
              isSender ? 'text-right' : 'text-left'
            )}>
              Ce message a été supprimé
            </div>
          ) : (
            message.text && (
              <div className={cn(
                'whitespace-pre-wrap break-words leading-relaxed',
                onlyEmoji ? 'text-5xl text-center' : 'mb-2'
              )}>
                {onlyEmoji ? (
                  <span>{message.text.trim()}</span>
                ) : (
                  message.text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                    if (part.match(/^https?:\/\/[^\s]+$/)) {
                      return (
                        <a
                          key={index}
                          href={part}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'underline break-all',
                            isSender ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'
                          )}
                        >
                          {part}
                        </a>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })
                )}
              </div>
            )
          )}

          {/* Picker de réactions */}
          {showReactionPicker && (
            <div className={cn(
              'absolute bg-white border-2 border-beige-200 rounded-xl p-2 shadow-xl z-20 grid grid-cols-6 gap-1 w-[240px]',
              isSender 
                ? 'right-0 -top-[180px]' 
                : 'left-0 -top-[180px]'
            )}>
              {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '👍', '👎', '❤️', '🔥', '🎉', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-beige-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Prévisualisation des images */}
          {imageUrls.length > 0 && (
            <div className="space-y-2 mb-2">
              {imageUrls.map((url, index) => (
                <LinkPreview key={index} url={url} />
              ))}
            </div>
          )}

          {/* Prévisualisation des liens */}
          {linkUrls.length > 0 && (
            <div className="space-y-2 mb-2">
              {linkUrls.map((url, index) => (
                <LinkPreview key={index} url={url} />
              ))}
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className={cn('space-y-2', message.text && 'mt-2')}>
              {message.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => openAttachment(attachment)}
                  className={cn(
                    'flex w-full items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:opacity-80',
                    isSender
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-beige-50 hover:bg-beige-100 border border-beige-200'
                  )}
                >
                  <div className={cn(
                    'flex-shrink-0',
                    isSender ? 'text-white' : 'text-beige-600'
                  )}>
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'font-semibold truncate',
                      isSender ? 'text-white' : 'text-neutral-900'
                    )}>
                      {attachment.name}
                    </p>
                    {attachment.size && (
                      <p className={cn(
                        'text-xs mt-0.5',
                        isSender ? 'text-white/70' : 'text-neutral-500'
                      )}>
                        {formatFileSize(attachment.size)}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    'flex-shrink-0',
                    isSender ? 'text-white/70' : 'text-neutral-400'
                  )}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Réactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn(
            'flex flex-wrap gap-1 mt-1',
            isSender ? 'justify-end' : 'justify-start'
          )}>
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105',
                  reactions.some(r => r.userId === user?.id)
                    ? 'bg-beige-500 text-white'
                    : 'bg-beige-100 text-neutral-700 hover:bg-beige-200'
                )}
              >
                <span>{emoji}</span>
                <span>{reactions.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Afficher l'heure toujours sous le dernier message du groupe (même minute) ou sous un message unique */}
        {!sameMinute && (
        <span className="text-xs text-neutral-400 px-2 font-medium">
          {formatMessageTime(message.createdAt)}
        </span>
        )}
      </div>
    </div>
  );
};
