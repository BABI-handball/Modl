'use client';

import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { reviewsStore } from '@/src/lib/reviewsStore';
import { ModelProfile } from '@/src/types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelProfile: ModelProfile;
  jobId: string;
  applicationId: string;
  reviewerUserId: string;
  onReviewSubmitted?: () => void;
}

interface RatingCriteria {
  key: 'professionalism' | 'punctuality' | 'communication' | 'appearance' | 'attitude';
  label: string;
  description: string;
}

const criteria: RatingCriteria[] = [
  {
    key: 'professionalism',
    label: 'Professionnalisme',
    description: 'Comportement général sur le plateau',
  },
  {
    key: 'punctuality',
    label: 'Ponctualité',
    description: 'À l\'heure au rendez-vous',
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Réactivité et clarté des échanges',
  },
  {
    key: 'appearance',
    label: 'Apparence conforme',
    description: 'Mensurations et physique conformes au profil',
  },
  {
    key: 'attitude',
    label: 'Attitude',
    description: 'Motivation et attitude positive',
  },
];

export const ReviewModal = ({
  isOpen,
  onClose,
  modelProfile,
  jobId,
  applicationId,
  reviewerUserId,
  onReviewSubmitted,
}: ReviewModalProps) => {
  const [ratings, setRatings] = useState<Record<string, number>>({
    professionalism: 0,
    punctuality: 0,
    communication: 0,
    appearance: 0,
    attitude: 0,
  });
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{ key: string; value: number } | null>(null);

  // Réinitialiser le formulaire quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      // Reset uniquement à la fermeture
      setTimeout(() => {
        setRatings({
          professionalism: 0,
          punctuality: 0,
          communication: 0,
          appearance: 0,
          attitude: 0,
        });
        setComment('');
        setHoveredRating(null);
      }, 300); // Délai pour l'animation de fermeture
    }
  }, [isOpen]);

  const handleRatingChange = (criterionKey: string, value: number) => {
    console.log('🌟 Setting', criterionKey, 'to', value);
    setRatings(prevRatings => {
      const newRatings = { ...prevRatings, [criterionKey]: value };
      console.log('📊 New ratings state:', newRatings);
      return newRatings;
    });
  };

  const handleSubmit = () => {
    console.log('📝 Submitting review with ratings:', ratings);
    
    // Vérifier que tous les critères ont une note
    const allRated = criteria.every((criterion) => ratings[criterion.key] > 0);
    console.log('✅ All rated?', allRated, 'Ratings:', ratings);
    
    if (!allRated) {
      const missingCriteria = criteria
        .filter(c => !ratings[c.key] || ratings[c.key] === 0)
        .map(c => c.label)
        .join(', ');
      alert(`Veuillez noter tous les critères avant de soumettre.\n\nCritères manquants: ${missingCriteria}`);
      return;
    }

    const review = reviewsStore.create({
      modelUserId: modelProfile.userId,
      reviewerUserId,
      jobId,
      applicationId,
      professionalism: ratings.professionalism,
      punctuality: ratings.punctuality,
      communication: ratings.communication,
      appearance: ratings.appearance,
      attitude: ratings.attitude,
      comment: comment.trim() || undefined,
    });

    console.log('✨ Review created:', review);
    
    // Récupérer les stats mises à jour
    const stats = reviewsStore.getModelStats(modelProfile.userId);
    console.log('📊 Updated model stats:', stats);

    onReviewSubmitted?.();
    onClose();
    
    // Forcer un rechargement de la page pour afficher la note
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const StarRating = ({ criterion }: { criterion: RatingCriteria }) => {
    const currentRating = ratings[criterion.key] || 0;
    const hoverValue = hoveredRating?.key === criterion.key ? hoveredRating.value : null;
    const displayValue = hoverValue !== null ? hoverValue : currentRating;

    return (
      <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-beige-50 rounded-xl border-2 border-transparent hover:border-beige-200 transition-all">
        <div>
          <h4 className="font-semibold text-neutral-800 text-sm sm:text-base">{criterion.label}</h4>
          <p className="text-xs sm:text-sm text-neutral-500">{criterion.description}</p>
        </div>
        <div className="flex gap-1 sm:gap-2 items-center flex-wrap">
          {[1, 2, 3, 4, 5].map((starNumber) => {
            const isSelected = starNumber <= currentRating;
            const isHovered = starNumber <= displayValue;
            
            return (
              <button
                key={starNumber}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`⭐ Star ${starNumber} selected for ${criterion.key}`);
                  handleRatingChange(criterion.key, starNumber);
                }}
                onMouseEnter={() => {
                  setHoveredRating({ key: criterion.key, value: starNumber });
                }}
                onMouseLeave={() => {
                  setHoveredRating(null);
                }}
                className="p-0.5 sm:p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <svg
                  className={`w-7 h-7 sm:w-10 sm:h-10 transition-colors ${
                    isSelected 
                      ? 'text-beige-500' 
                      : isHovered 
                        ? 'text-beige-300' 
                        : 'text-gray-300'
                  }`}
                  fill={isSelected || isHovered ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            );
          })}
          <div className="ml-1 sm:ml-2 min-w-[60px] sm:min-w-[70px]">
            <span className="text-base sm:text-lg font-bold text-neutral-800">
              {currentRating > 0 ? `${currentRating}/5` : '0/5'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Évaluer le shooting" className="z-[60] max-w-xl sm:max-w-2xl">
      <div className="space-y-4 sm:space-y-6">
        {/* Info du modèle */}
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-beige-50 rounded-xl">
          {modelProfile.avatarUrl && (
            <img
              src={modelProfile.avatarUrl}
              alt={modelProfile.name}
              className="h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-beige-200 flex-shrink-0"
            />
          )}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">{modelProfile.name}</h3>
            <p className="text-xs sm:text-sm text-neutral-600">Comment s'est passé ce shooting ?</p>
          </div>
        </div>

        {/* Critères de notation */}
        <div className="space-y-3 sm:space-y-4">
          {criteria.map((criterion) => (
            <StarRating key={criterion.key} criterion={criterion} />
          ))}
        </div>

        {/* Moyenne globale */}
        {(() => {
          const totalRatings = Object.values(ratings).reduce((sum, val) => sum + val, 0);
          const countRatings = Object.values(ratings).filter(val => val > 0).length;
          const average = countRatings > 0 ? (totalRatings / 5).toFixed(1) : '0.0';
          
          return (
            <div className="p-3 sm:p-5 bg-gradient-to-br from-beige-100 to-beige-50 rounded-xl border-2 border-beige-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">Note moyenne</h3>
                  <p className="text-xs sm:text-sm text-neutral-600">
                    {countRatings === 5 ? 'Tous les critères notés' : `${countRatings}/5 critères notés`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <svg className="w-7 h-7 sm:w-10 sm:h-10 text-beige-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-2xl sm:text-4xl font-bold text-neutral-900">{average}</span>
                  <span className="text-lg sm:text-2xl font-semibold text-neutral-500">/5</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Commentaire optionnel */}
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-neutral-700">
            Commentaire (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience avec ce modèle..."
            rows={3}
            className="w-full rounded-xl border-2 border-beige-200 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-neutral-900 placeholder-neutral-400 focus:border-beige-400 focus:outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-beige-500 hover:bg-beige-600"
          >
            Soumettre l'évaluation
          </Button>
        </div>
      </div>
    </Modal>
  );
};
