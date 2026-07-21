'use client';

import { useEffect, useState } from 'react';
import { ModelReview } from '@/src/types';
import { reviewsStoreSupabase } from '@/src/lib/reviewsSupabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { formatRelativeTime } from '@/src/lib/utils';
import { userStore } from '@/src/lib/userStore';

interface ReviewsListProps {
  modelUserId: string;
  showTitle?: boolean;
}

export const ReviewsList = ({ modelUserId, showTitle = true }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<ModelReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      try {
        const supabaseReviews = await reviewsStoreSupabase.getByModelId(modelUserId);
        setReviews(supabaseReviews);
      } catch (error) {
        console.error('Erreur lors du chargement des reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [modelUserId]);

  if (isLoading) {
    return (
      <Card className="border-2 border-beige-200 shadow-xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/40 to-beige-100/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,245,220,0.2),_transparent_60%)] pointer-events-none"></div>
        <CardContent className="p-8 relative z-10">
          <div className="text-center text-neutral-600">Chargement des avis...</div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="border-2 border-beige-200 shadow-xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/40 to-beige-100/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,245,220,0.2),_transparent_60%)] pointer-events-none"></div>
        {showTitle && (
          <CardHeader className="pb-6 border-b-2 border-beige-200/50 relative z-10">
            <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">
              Avis
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-100 mb-4">
              <svg className="w-8 h-8 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-neutral-900 mb-2">Aucun avis pour le moment</p>
            <p className="text-sm text-neutral-600">Les avis apparaîtront ici après vos shootings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-beige-200 shadow-xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/40 to-beige-100/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,245,220,0.2),_transparent_60%)] pointer-events-none"></div>
      {showTitle && (
        <CardHeader className="pb-6 border-b-2 border-beige-200/50 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">
              Avis
            </CardTitle>
            <div className="flex items-center gap-2 bg-gradient-to-br from-beige-400 to-beige-500 rounded-full px-4 py-2 shadow-md">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-base font-bold text-white">{reviews.length}</span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4 pt-6 relative z-10">
        {reviews.map((review) => {
          // Récupérer le profil du reviewer
          const reviewerProfile = userStore.getBrandProfile(review.reviewerUserId) || 
                                 userStore.getPhotographerProfile(review.reviewerUserId);
          const reviewerName = reviewerProfile 
            ? ('companyName' in reviewerProfile ? reviewerProfile.companyName : reviewerProfile.name)
            : 'Anonyme';

          return (
            <div
              key={review.id}
              className="p-5 sm:p-6 rounded-xl bg-white/60 backdrop-blur-sm border-2 border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Header avec nom et note globale */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-beige-300 to-beige-400 flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-neutral-800">
                        {reviewerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-base">{reviewerName}</h4>
                      <span className="text-xs text-neutral-500">
                        {formatRelativeTime(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Note globale */}
                <div className="flex items-center gap-1.5 bg-gradient-to-br from-beige-400 to-beige-500 rounded-full px-4 py-2 shadow-md">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-base font-bold text-white">
                    {review.overallRating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {/* Notes détaillées */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Professionnalisme', value: review.professionalism },
                  { label: 'Ponctualité', value: review.punctuality },
                  { label: 'Communication', value: review.communication },
                  { label: 'Apparence', value: review.appearance },
                  { label: 'Attitude', value: review.attitude },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between p-2.5 rounded-lg bg-beige-50/50 border border-beige-200/50">
                    <span className="text-xs sm:text-sm font-medium text-neutral-700">{label}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < value
                                ? 'text-beige-600 fill-current'
                                : 'text-neutral-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-neutral-700 ml-1 min-w-[1.5rem] text-right">
                        {value}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Commentaire */}
              {review.comment && (
                <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-beige-50 to-beige-100/50 border border-beige-200/70 shadow-sm">
                  <p className="text-sm text-neutral-700 leading-relaxed">{review.comment}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
