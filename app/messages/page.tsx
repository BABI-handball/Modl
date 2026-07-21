'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { messagesStore } from '@/src/lib/messagesStore';
import { Thread } from '@/src/types/messaging';
import { ThreadCard } from '@/src/components/messaging/ThreadCard';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { EmptyState } from '@/src/components/ui/EmptyState';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';
import { formatRelativeTime } from '@/src/lib/utils';

export default function MessagesPage() {
  const { user, isLoading } = useRequireUser();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshThreads = useCallback(() => {
    if (!user) return;
    const userThreads = messagesStore.getThreadsForUser(user.id);
    setThreads(userThreads);
  }, [user?.id]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  // Rafraîchir périodiquement (moins souvent pour éviter les re-renders constants)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshThreads();
    }, 10000); // Augmenté à 10 secondes au lieu de 2

    return () => clearInterval(interval);
  }, [refreshThreads, user]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter((thread) => {
      const otherParticipant = thread.participantSummaries.find((p) => p.id !== user?.id);
      return (
        otherParticipant?.name.toLowerCase().includes(query) ||
        thread.lastMessage?.text.toLowerCase().includes(query)
      );
    });
  }, [threads, searchQuery, user?.id]);

  const unreadCount = useMemo(() => {
    return threads.reduce((sum, thread) => {
      const preview = messagesStore.getThreadPreview(thread.id, user?.id || '');
      return sum + preview.unreadCount;
    }, 0);
  }, [threads, user?.id]);

  // Bloquer le scroll sur cette page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Early returns APRÈS tous les hooks
  if (isLoading) {
    return (
      <div className="h-screen bg-beige-50 flex items-center justify-center overflow-hidden">
        <div className="text-neutral-600">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col animate-fade-in relative backdrop-blur-[0.5px]">
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 relative z-10">
        <div className="mx-auto max-w-5xl px-3 sm:px-6 md:px-12 pt-6 sm:pt-12 md:pt-16 pb-6">
        <div className="mb-4 sm:mb-6 transition-all duration-300">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">
            Pour vous
          </p>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h1 className="font-display mb-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
              Vos <span className="italic text-beige-700">messages</span>
            </h1>
            {unreadCount > 0 && (
              <Badge variant="primary" className="text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 shadow-[0_2px_4px_rgba(176,176,140,0.25)]">
                {unreadCount} {unreadCount > 1 ? 'non lus' : 'non lu'}
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-neutral-500">
            Vos conversations avec les marques et les modèles
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6 relative group">
          <div className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-600 transition-colors duration-300 z-10">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Liste des conversations */}
        {filteredThreads.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-8 w-8 text-beige-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title={searchQuery ? 'Aucune conversation trouvée' : 'Aucun message pour le moment'}
            description={
              searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez une conversation en sélectionnant un candidat ou en répondant à une annonce'
            }
            action={
              !searchQuery && (
                <Link href={user.role === 'MODEL' ? '/jobs' : '/post-job'}>
                  <Button variant="beige">
                    {user.role === 'MODEL' ? 'Explorer les annonces' : 'Créer une annonce'}
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredThreads.map((thread) => {
              const preview = messagesStore.getThreadPreview(thread.id, user.id);
              // Créer un thread avec le lastMessage du preview pour afficher correctement les messages supprimés
              const threadWithPreview = {
                ...thread,
                lastMessage: preview.lastMessage,
              };
              return (
                <ThreadCard
                  key={thread.id}
                  thread={threadWithPreview}
                  currentUserId={user.id}
                  unreadCount={preview.unreadCount}
                  onDelete={refreshThreads}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
