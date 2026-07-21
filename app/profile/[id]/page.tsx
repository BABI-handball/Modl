'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userStore } from '@/src/lib/userStore';
import { ModelProfile, PhotographerProfile, BrandProfile } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useCurrentUser } from '@/src/hooks/useCurrentUser';
import { messagesStore } from '@/src/lib/messagesStore';
import { ReviewsList } from '@/src/components/ReviewsList';
import { reviewsStore } from '@/src/lib/reviewsStore';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser(false);
  const userId = (typeof params.id === 'string' ? params.id : params.id?.[0]) || '';
  
  const [modelProfile, setModelProfile] = useState<ModelProfile | null>(null);
  const [photographerProfile, setPhotographerProfile] = useState<PhotographerProfile | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [profileRole, setProfileRole] = useState<'MODEL' | 'PHOTOGRAPHER' | 'BRAND' | null>(null);

  useEffect(() => {
    // Essayer de trouver le profil dans les différents stores
    const model = userStore.getModelProfile(userId);
    if (model) {
      setModelProfile(model);
      setProfileRole('MODEL');
      return;
    }
    
    const photographer = userStore.getPhotographerProfile(userId);
    if (photographer) {
      setPhotographerProfile(photographer);
      setProfileRole('PHOTOGRAPHER');
      return;
    }
    
    const brand = userStore.getBrandProfile(userId);
    if (brand) {
      setBrandProfile(brand);
      setProfileRole('BRAND');
      return;
    }
  }, [userId]);

  const handleContact = () => {
    if (!currentUser || !profileRole || currentUser.id === userId) return;
    
    try {
      const threadId = messagesStore.getOrCreateThread(
        currentUser.id,
        userId,
        undefined,
        `Bonjour, je suis ${currentUser.name || 'un utilisateur'}. J'aimerais en savoir plus sur votre profil.`
      );
      router.push(`/messages/${threadId}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      router.push('/messages');
    }
  };

  if (!profileRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profil introuvable</p>
          <Button onClick={() => router.back()}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40 sm:pb-28">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour
        </button>

        {/* Model Profile */}
        {profileRole === 'MODEL' && modelProfile && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {modelProfile.avatarUrl ? (
                    <img
                      src={modelProfile.avatarUrl}
                      alt={modelProfile.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-3xl font-semibold">
                      {modelProfile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{modelProfile.name}</h1>
                      {(() => {
                        const stats = reviewsStore.getModelStats(modelProfile.userId);
                        if (stats.totalReviews > 0) {
                          return (
                            <div className="flex items-center gap-1 bg-beige-500 rounded-full px-3 py-1">
                              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <span className="text-sm font-bold text-white">{stats.averageRating.toFixed(1)}</span>
                              <span className="text-xs text-white">({stats.totalReviews})</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-gray-600">{modelProfile.city}</p>
                    {modelProfile.age && <p className="text-sm text-gray-500">{modelProfile.age} ans</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {modelProfile.height && (
                    <div>
                      <span className="font-medium text-gray-700">Taille:</span> {modelProfile.height} cm
                    </div>
                  )}
                  {modelProfile.weight && (
                    <div>
                      <span className="font-medium text-gray-700">Poids:</span> {modelProfile.weight} kg
                    </div>
                  )}
                  {modelProfile.eyeColor && (
                    <div>
                      <span className="font-medium text-gray-700">Yeux:</span> {modelProfile.eyeColor}
                    </div>
                  )}
                  {modelProfile.hairColor && (
                    <div>
                      <span className="font-medium text-gray-700">Cheveux:</span> {modelProfile.hairColor}
                    </div>
                  )}
                  {modelProfile.experienceYears !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Expérience:</span> {modelProfile.experienceYears} ans
                    </div>
                  )}
                </div>
                {modelProfile.bio && (
                  <div>
                    <p className="text-gray-700">{modelProfile.bio}</p>
                  </div>
                )}
                {modelProfile.tags && modelProfile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {modelProfile.tags.map((tag) => (
                      <Badge key={tag} variant="primary">
                        {tag === 'RUNWAY' ? 'Runway' : tag === 'COMMERCIAL' ? 'Commercial' : tag === 'EDITORIAL' ? 'Éditorial' : tag === 'FITNESS' ? 'Fitness' : tag === 'BEAUTY' ? 'Beauté' : tag === 'LIFESTYLE' ? 'Lifestyle' : 'E-commerce'}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {modelProfile.portfolioImages && modelProfile.portfolioImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {modelProfile.portfolioImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Portfolio ${idx + 1}`}
                        className="h-40 w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews - Avis reçus */}
            <ReviewsList modelUserId={modelProfile.userId} />

            {currentUser && currentUser.id !== userId && (
              <Button onClick={handleContact} className="w-full" size="lg">
                Envoyer un message
              </Button>
            )}
          </div>
        )}

        {/* Photographer Profile */}
        {profileRole === 'PHOTOGRAPHER' && photographerProfile && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {photographerProfile.avatarUrl ? (
                    <img
                      src={photographerProfile.avatarUrl}
                      alt={photographerProfile.name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-violet-600 text-3xl font-semibold">
                      {photographerProfile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{photographerProfile.name}</h1>
                    <p className="text-gray-600">{photographerProfile.city}</p>
                    {photographerProfile.portfolioLink && (
                      <a href={photographerProfile.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {photographerProfile.bio && (
                  <p className="text-gray-700">{photographerProfile.bio}</p>
                )}
                {photographerProfile.specialties && photographerProfile.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {photographerProfile.specialties.map((specialty) => (
                      <Badge key={specialty} variant="primary">
                        {specialty === 'PORTRAIT' ? 'Portrait' : specialty === 'FASHION' ? 'Mode' : specialty === 'STUDIO' ? 'Studio' : specialty === 'OUTDOOR' ? 'Extérieur' : specialty === 'WEDDING' ? 'Mariage' : specialty === 'EVENT' ? 'Événement' : 'Produit'}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {photographerProfile.portfolioImages && photographerProfile.portfolioImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Galerie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {photographerProfile.portfolioImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Portfolio ${idx + 1}`}
                        className="h-40 w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentUser && currentUser.id !== userId && (
              <Button onClick={handleContact} className="w-full" size="lg">
                Envoyer un message
              </Button>
            )}
          </div>
        )}

        {/* Brand Profile */}
        {profileRole === 'BRAND' && brandProfile && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {brandProfile.logoUrl ? (
                    <img
                      src={brandProfile.logoUrl}
                      alt={brandProfile.companyName}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-2xl font-semibold">
                      {brandProfile.companyName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{brandProfile.companyName}</h1>
                    <p className="text-gray-600">{brandProfile.city}</p>
                    {brandProfile.website && (
                      <a href={brandProfile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline">
                        {brandProfile.website}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>À propos</CardTitle>
              </CardHeader>
              <CardContent>
                {brandProfile.bio && (
                  <p className="text-gray-700">{brandProfile.bio}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
