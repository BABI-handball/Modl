'use client';

import { useState } from 'react';
import { Application, ModelProfile, JobPost } from '@/src/types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { ReviewModal } from './ReviewModal';
import { reviewsStore } from '@/src/lib/reviewsStore';
import { formatDate } from '@/src/lib/utils';

interface SelectedModelCardProps {
  application: Application;
  modelProfile: ModelProfile;
  job?: JobPost;
  currentUserId: string;
  onReviewSubmitted?: () => void;
}

export const SelectedModelCard = ({
  application,
  modelProfile,
  job,
  currentUserId,
  onReviewSubmitted,
}: SelectedModelCardProps) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(
    reviewsStore.hasReviewForApplication(application.id)
  );

  // Récupérer les statistiques du modèle
  const modelStats = reviewsStore.getModelStats(modelProfile.userId);

  const handleReviewSubmitted = () => {
    setHasReviewed(true);
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {/* Photo du modèle */}
            <div className="flex-shrink-0">
              <img
                src={modelProfile.avatarUrl || modelProfile.portfolioImages[0]}
                alt={modelProfile.name}
                className="h-24 w-24 rounded-xl object-cover border-2 border-beige-200"
              />
            </div>

            {/* Informations */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-neutral-900">{modelProfile.name}</h3>
                    {modelProfile.verified && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-beige-500">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {modelStats.totalReviews > 0 && (
                      <div className="flex items-center gap-1 bg-beige-500 rounded-full px-2 py-0.5">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-xs font-bold text-white">
                          {modelStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-white">({modelStats.totalReviews})</span>
                      </div>
                    )}
                  </div>

                  {/* Infos du job */}
                  {job && (
                    <p className="text-sm text-neutral-600 mt-1">
                      <span className="font-semibold">{job.title}</span>
                    </p>
                  )}

                  {/* Date de sélection */}
                  {application.selectedAt && (
                    <p className="text-xs text-neutral-500 mt-1">
                      Travaillé le {formatDate(application.selectedAt)}
                    </p>
                  )}

                  {/* Mensurations clés */}
                  <div className="flex gap-3 mt-2 text-xs text-neutral-600">
                    {modelProfile.height && (
                      <span>{modelProfile.height} cm</span>
                    )}
                    {modelProfile.bust && modelProfile.waist && modelProfile.hips && (
                      <span>{modelProfile.bust}-{modelProfile.waist}-{modelProfile.hips}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message de candidature si présent */}
              {application.message && (
                <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                  {application.message}
                </p>
              )}

              {/* Bouton d'évaluation */}
              <div className="mt-3">
                {hasReviewed ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Évaluation envoyée</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setShowReviewModal(true)}
                    className="bg-beige-500 hover:bg-beige-600"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Évaluer ce shooting
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'évaluation */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        modelProfile={modelProfile}
        jobId={application.jobId}
        applicationId={application.id}
        reviewerUserId={currentUserId}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </>
  );
};
