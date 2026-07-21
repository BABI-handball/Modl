import { ModelReview, ModelStats } from '@/src/types';
import { reviewsStoreSupabase } from './reviewsSupabase';

const REVIEWS_KEY = 'modl_reviews';

class ReviewsStore {
  private dedupeReviews(reviews: ModelReview[]): ModelReview[] {
    const byApplication = new Map<string, ModelReview>();
    const withoutApplication: ModelReview[] = [];

    reviews.forEach((review) => {
      const key = review.applicationId?.trim();
      if (!key) {
        withoutApplication.push(review);
        return;
      }

      const existing = byApplication.get(key);
      if (!existing || new Date(review.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        byApplication.set(key, review);
      }
    });

    return [...byApplication.values(), ...withoutApplication];
  }

  private getReviews(): ModelReview[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(REVIEWS_KEY);
    if (!data) return [];
    
    try {
      const reviews = JSON.parse(data);
      return reviews.map((review: any) => ({
        ...review,
        createdAt: new Date(review.createdAt),
      }));
    } catch {
      return [];
    }
  }

  private saveReviews(reviews: ModelReview[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }

  // Créer une nouvelle évaluation
  create(review: Omit<ModelReview, 'id' | 'createdAt' | 'overallRating'>): ModelReview {
    const reviews = this.getReviews();
    
    // Calculer la note globale (moyenne des 5 critères)
    const overallRating = (
      review.professionalism +
      review.punctuality +
      review.communication +
      review.appearance +
      review.attitude
    ) / 5;
    
    const newReview: ModelReview = {
      ...review,
      id: `review_${Date.now()}_${Math.random()}`,
      overallRating: Math.round(overallRating * 10) / 10, // Arrondi à 1 décimale
      createdAt: new Date(),
    };
    
    reviews.push(newReview);
    this.saveReviews(reviews);
    
    // Sauvegarder dans Supabase en arrière-plan
    reviewsStoreSupabase.create(review)
      .then((supabaseReview) => {
        if (supabaseReview) {
          console.log('✅ Évaluation créée dans Supabase:', supabaseReview.id);
          // Mettre à jour l'ID local avec l'ID Supabase si différent
          if (supabaseReview.id !== newReview.id) {
            const localReviews = this.getReviews();
            const index = localReviews.findIndex(r => r.id === newReview.id);
            if (index !== -1) {
              localReviews[index] = supabaseReview;
              this.saveReviews(localReviews);
            }
          }
        }
      })
      .catch((error) => {
        // Ne pas logger pour les comptes dev (UUID invalide)
        const errorMsg = error?.message || String(error);
        if (!errorMsg.includes('UUID') && !errorMsg.includes('uuid')) {
          console.warn('⚠️ Échec de la création Supabase de l\'évaluation:', error);
        }
      });
    
    return newReview;
  }

  // Récupérer toutes les évaluations d'un modèle
  getByModelId(modelUserId: string): ModelReview[] {
    const reviews = this.getReviews();
    const localReviews = this.dedupeReviews(
      reviews.filter(review => review.modelUserId === modelUserId)
    );
    
    // Charger depuis Supabase en arrière-plan pour synchroniser
    setTimeout(async () => {
      try {
        const supabaseReviews = await reviewsStoreSupabase.getByModelId(modelUserId);
        
        // Fusionner avec les évaluations locales (priorité aux locales)
        const reviewsMap = new Map<string, ModelReview>();
        
        // Ajouter d'abord les évaluations locales
        localReviews.forEach(review => {
          reviewsMap.set(review.id, review);
        });
        
        // Ajouter les évaluations Supabase (complètent mais n'écrasent pas)
        supabaseReviews.forEach(review => {
          const alreadyPresentByApplication = Array.from(reviewsMap.values()).some(
            (localReview) =>
              localReview.applicationId &&
              review.applicationId &&
              localReview.applicationId === review.applicationId
          );

          if (!reviewsMap.has(review.id) && !alreadyPresentByApplication) {
            reviewsMap.set(review.id, review);
            // Sauvegarder dans localStorage
            const allReviews = this.getReviews();
            const hasSameId = allReviews.some(r => r.id === review.id);
            const hasSameApplication = allReviews.some(
              (r) =>
                r.applicationId &&
                review.applicationId &&
                r.applicationId === review.applicationId
            );
            if (!hasSameId && !hasSameApplication) {
              allReviews.push(review);
              this.saveReviews(this.dedupeReviews(allReviews));
            }
          }
        });
      } catch (error) {
        console.warn('Chargement Supabase des évaluations échoué');
      }
    }, 2000);
    
    return localReviews;
  }

  // Récupérer les statistiques d'un modèle
  getModelStats(modelUserId: string): ModelStats {
    // Charger depuis Supabase en temps réel pour avoir les stats à jour
    let reviews = this.dedupeReviews(this.getByModelId(modelUserId));
    
    // Si pas de reviews locales, essayer de charger depuis Supabase de manière synchrone
    // (pour les profils publics notamment)
    if (reviews.length === 0) {
      // Charger depuis Supabase en arrière-plan et mettre à jour
      reviewsStoreSupabase.getByModelId(modelUserId)
        .then((supabaseReviews) => {
          if (supabaseReviews.length > 0) {
            // Mettre à jour localStorage pour les prochaines fois
            const allReviews = this.getReviews();
            supabaseReviews.forEach(review => {
              if (!allReviews.some(r => r.id === review.id)) {
                allReviews.push(review);
              }
            });
            this.saveReviews(allReviews);
          }
        })
        .catch(() => {
          // Ignorer les erreurs silencieusement
        });
    }
    
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        professionalismAvg: 0,
        punctualityAvg: 0,
        communicationAvg: 0,
        appearanceAvg: 0,
        attitudeAvg: 0,
      };
    }
    
    const sum = reviews.reduce((acc, review) => ({
      professionalism: acc.professionalism + review.professionalism,
      punctuality: acc.punctuality + review.punctuality,
      communication: acc.communication + review.communication,
      appearance: acc.appearance + review.appearance,
      attitude: acc.attitude + review.attitude,
      overall: acc.overall + review.overallRating,
    }), {
      professionalism: 0,
      punctuality: 0,
      communication: 0,
      appearance: 0,
      attitude: 0,
      overall: 0,
    });
    
    const count = reviews.length;
    
    return {
      totalReviews: count,
      averageRating: Math.round((sum.overall / count) * 10) / 10,
      professionalismAvg: Math.round((sum.professionalism / count) * 10) / 10,
      punctualityAvg: Math.round((sum.punctuality / count) * 10) / 10,
      communicationAvg: Math.round((sum.communication / count) * 10) / 10,
      appearanceAvg: Math.round((sum.appearance / count) * 10) / 10,
      attitudeAvg: Math.round((sum.attitude / count) * 10) / 10,
    };
  }

  // Vérifier si une évaluation existe déjà pour une candidature
  hasReviewForApplication(applicationId: string): boolean {
    const reviews = this.dedupeReviews(this.getReviews());
    const localHasReview = reviews.some(review => review.applicationId === applicationId);
    
    // Vérifier aussi dans Supabase en arrière-plan
    setTimeout(async () => {
      try {
        const supabaseHasReview = await reviewsStoreSupabase.hasReviewForApplication(applicationId);
        if (supabaseHasReview && !localHasReview) {
          // Charger l'évaluation depuis Supabase
          const allReviews = this.getReviews();
          const supabaseReviews = await reviewsStoreSupabase.getAll();
          supabaseReviews.forEach(review => {
            if (review.applicationId === applicationId && !allReviews.some(r => r.id === review.id)) {
              allReviews.push(review);
            }
          });
          this.saveReviews(allReviews);
        }
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    }, 1000);
    
    return localHasReview;
  }

  // Récupérer une évaluation spécifique
  getById(reviewId: string): ModelReview | null {
    const reviews = this.getReviews();
    return reviews.find(review => review.id === reviewId) || null;
  }

  // Récupérer toutes les évaluations
  getAll(): ModelReview[] {
    return this.getReviews();
  }
}

export const reviewsStore = new ReviewsStore();
