'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Thread } from '@/src/types/messaging';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatRelativeTime } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import { messagesStore } from '@/src/lib/messagesStore';

interface ThreadCardProps {
  thread: Thread;
  currentUserId: string;
  unreadCount?: number;
  onDelete?: () => void;
}

export const ThreadCard = ({ thread, currentUserId, unreadCount = 0, onDelete }: ThreadCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const otherParticipant = thread.participantSummaries.find((p) => p.id !== currentUserId);
  
  if (!otherParticipant) return null;

  const isUnread = unreadCount > 0 && thread.lastMessage?.fromId !== currentUserId;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showConfirm) {
      messagesStore.deleteThread(thread.id, currentUserId);
      if (onDelete) {
        onDelete();
      }
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/messages/${thread.id}`}>
        <Card className={cn(
          "cursor-pointer transition-all duration-300 ease-out hover:shadow-xl border-2 group",
          isUnread ? "border-beige-400 bg-beige-50" : "border-beige-200 bg-white"
        )}>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-5">
              {/* Avatar moderne */}
              <div className="relative flex-shrink-0">
                {otherParticipant.avatarUrl ? (
                  <img
                    src={otherParticipant.avatarUrl}
                    alt={otherParticipant.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-beige-200 shadow-sm group-hover:ring-beige-300 transition-all duration-300"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white font-bold text-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                    {otherParticipant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {unreadCount > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-6 w-6 min-w-[1.5rem] items-center justify-center rounded-full bg-beige-500 text-xs font-bold text-white shadow-[0_2px_4px_rgba(176,176,140,0.3)] ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={cn(
                        "font-bold text-lg sm:text-xl truncate tracking-tight",
                        isUnread ? "text-neutral-900" : "text-neutral-800"
                      )}>
                        {otherParticipant.name}
                      </h3>
                      <Badge variant="primary" className="text-xs font-semibold flex-shrink-0">
                        {otherParticipant.role === 'MODEL' ? 'Modèle' : otherParticipant.role === 'BRAND' ? 'Marque' : 'Photographe'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {thread.lastMessage && (
                      <span className="text-sm text-neutral-500 font-semibold whitespace-nowrap">
                        {formatRelativeTime(thread.lastMessage.createdAt)}
                      </span>
                    )}
                    {/* Bouton de suppression */}
                    {isHovered && !showConfirm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="p-2 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                        title="Supprimer la conversation"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                    {showConfirm && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          className="px-2 py-1 text-xs"
                        >
                          Confirmer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          className="px-2 py-1 text-xs"
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className={cn(
                  "text-base line-clamp-2 leading-relaxed",
                  isUnread ? "text-neutral-900 font-semibold" : "text-neutral-600",
                  thread.lastMessage?.text === 'Ce message a été supprimé' ? "italic text-neutral-400" : ""
                )}>
                  {thread.lastMessage?.text || 'Aucun message'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};
