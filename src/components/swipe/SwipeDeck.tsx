'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Candidate } from '@/src/types/candidate';
import { CandidateCard } from './CandidateCard';
import { applicationsStore } from '@/src/lib/applications';

interface SwipeDeckProps {
  candidates: Candidate[];
  onSwipe: (candidateId: string, direction: 'left' | 'right') => void;
  onFinish?: () => void;
  onModalOpenChange?: (isOpen: boolean) => void;
}

export const SwipeDeck = ({ candidates, onSwipe, onFinish, onModalOpenChange }: SwipeDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const candidatesKeyRef = useRef<string>('');

  const handleModalOpenChange = (isOpen: boolean) => {
    setIsModalOpen(isOpen);
    onModalOpenChange?.(isOpen);
  };

  // Réinitialiser l'index seulement si la liste des candidats change vraiment (nouveaux IDs)
  useEffect(() => {
    const newKey = candidates.map(c => c.applicationId).join(',');
    if (newKey !== candidatesKeyRef.current && candidatesKeyRef.current !== '') {
      if (currentIndex === 0) {
        setExitingId(null);
      }
    }
    candidatesKeyRef.current = newKey;
  }, [candidates.map(c => c.applicationId).join(','), currentIndex]);

  const currentCandidate = candidates[currentIndex];
  const remaining = candidates.length - currentIndex;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentCandidate) {
      return;
    }

    const candidateId = currentCandidate.applicationId;
    setExitingId(candidateId);
    
    // Si swipe right, marquer la candidature comme sélectionnée
    if (direction === 'right') {
      applicationsStore.markAsSelected(candidateId);
    }
    
    onSwipe(candidateId, direction);

    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= candidates.length) {
          onFinish?.();
          return prevIndex;
        }
        return nextIndex;
      });
      setExitingId(null);
    }, 300);
  }, [currentCandidate, candidates.length, onSwipe, onFinish]);

  const handleCardSwipe = useCallback((direction: 'left' | 'right') => {
    handleSwipe(direction);
  }, [handleSwipe]);

  if (candidates.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">Plus de candidats</p>
          <p className="text-gray-600 mt-2 text-lg">Tous les candidats ont été traités</p>
        </div>
      </div>
    );
  }

  // Afficher les 3 premières cartes (celle du dessus + 2 en dessous)
  const visibleCards = candidates.slice(currentIndex, currentIndex + 3);

  return (
    <div className="relative h-full w-full">
      {/* Compteur discret en haut à droite - masqué quand le modal est ouvert */}
      {remaining > 0 && !isModalOpen && (
        <div className="absolute top-4 right-4 z-30 bg-beige-100/95 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-beige-300">
          <span className="text-xs font-semibold text-neutral-700">
            {remaining} {remaining > 1 ? 'restants' : 'restant'}
          </span>
        </div>
      )}

      {/* Pile de cartes */}
      <div className="relative h-full w-full px-4 pt-4 pb-20">
        <AnimatePresence>
          {visibleCards.map((candidate, index) => {
            if (exitingId === candidate.applicationId && index === 0) {
              return null;
            }
            return (
              <CandidateCard
                key={candidate.applicationId}
                candidate={candidate}
                index={index}
                total={visibleCards.length}
                onSwipe={index === 0 ? handleCardSwipe : undefined}
                onModalOpenChange={index === 0 ? handleModalOpenChange : undefined}
              />
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
};
