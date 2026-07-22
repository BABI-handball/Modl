'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { userStore } from '@/src/lib/userStore';
import { ModelProfile, PhotographerProfile, BrandProfile, ModelTag, PhotographerSpecialty, BrandType, JobPost, Application } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Toast } from '@/src/components/ui/Toast';
import { cn } from '@/src/lib/utils';
import { jobsStore } from '@/src/lib/jobs';
import { jobsStoreSupabase } from '@/src/lib/jobsSupabase';
import { userProfilesSupabase } from '@/src/lib/userProfilesSupabase';
import { MyJobCard } from '@/src/components/MyJobCard';
import { applicationsStore } from '@/src/lib/applications';
import { mockJobPosts } from '@/src/data/mock';
import { formatDate, getCreativeTypeLabel, getBrandTypeLabel } from '@/src/lib/utils';
import { Modal } from '@/src/components/ui/Modal';
import { ImageUpload } from '@/src/components/ui/ImageUpload';
import { reviewsStore } from '@/src/lib/reviewsStore';
import { ReviewsList } from '@/src/components/ReviewsList';
import { listingQuota } from '@/src/lib/listingQuota';

export default function ProfilePage() {
  const loadMyJobs = useCallback((ownerId: string) => {
    // Source locale
    const localJobs = jobsStore.getByOwnerId(ownerId);
    const jobsMap = new Map<string, JobPost>();
    localJobs.forEach((job) => jobsMap.set(job.id, job));

    // Dernière annonce créée (fallback immédiat après publication)
    try {
      const raw = localStorage.getItem('modl_last_created_job');
      if (raw) {
        const lastCreated = JSON.parse(raw);
        if (lastCreated?.ownerUserId === ownerId && lastCreated?.id) {
          jobsMap.set(lastCreated.id, {
            ...lastCreated,
            date: new Date(lastCreated.date),
            createdAt: new Date(lastCreated.createdAt),
          });
        }
      }
    } catch {
      // no-op
    }

    setMyJobs(Array.from(jobsMap.values()));

    // Source Supabase en complément (sans écraser les locales)
    jobsStoreSupabase.getByOwnerId(ownerId).then((remoteJobs) => {
      if (!remoteJobs || remoteJobs.length === 0) return;
      const map = new Map<string, JobPost>();
      jobsMap.forEach((job, id) => map.set(id, job));
      remoteJobs.forEach((job) => {
        if (!map.has(job.id)) map.set(job.id, job);
      });
      setMyJobs(Array.from(map.values()));
    }).catch(() => {
      // no-op
    });
  }, []);

  const router = useRouter();
  const { user, isLoading } = useRequireUser();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [modelProfile, setModelProfile] = useState<ModelProfile | null>(null);
  const [photographerProfile, setPhotographerProfile] = useState<PhotographerProfile | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  
  // États de sauvegarde pour restaurer en cas d'annulation
  const [savedModelProfile, setSavedModelProfile] = useState<ModelProfile | null>(null);
  const [savedPhotographerProfile, setSavedPhotographerProfile] = useState<PhotographerProfile | null>(null);
  const [savedBrandProfile, setSavedBrandProfile] = useState<BrandProfile | null>(null);
  const [myJobs, setMyJobs] = useState<JobPost[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationPhotos, setVerificationPhotos] = useState<string[]>(['', '']);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTransitioning, setGalleryTransitioning] = useState(false);

  // Bloquer le scroll sur cette page - DOIT être avant les early returns
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Navigation clavier dans la galerie
  useEffect(() => {
    if (!galleryOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (galleryTransitioning) return;
      
      if (e.key === 'ArrowLeft') {
        setGalleryTransitioning(true);
        setTimeout(() => {
          setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
          setTimeout(() => setGalleryTransitioning(false), 50);
        }, 150);
      } else if (e.key === 'ArrowRight') {
        setGalleryTransitioning(true);
        setTimeout(() => {
          setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
          setTimeout(() => setGalleryTransitioning(false), 50);
        }, 150);
      } else if (e.key === 'Escape') {
        setGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, galleryImages.length, galleryTransitioning]);

  // Masquer la navbar quand la galerie est ouverte
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      if (galleryOpen) {
        navbar.style.display = 'none';
      } else {
        navbar.style.display = '';
      }
    }
    return () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        navbar.style.display = '';
      }
    };
  }, [galleryOpen]);

  useEffect(() => {
    if (!user) return;
    
    if (user.role === 'MODEL') {
      const profile = userStore.getModelProfile(user.id);
      if (profile) {
        const profileCopy = JSON.parse(JSON.stringify(profile));
        setModelProfile(profileCopy);
        // Sauvegarder une copie pour la restauration
        if (!isEditing) {
          setSavedModelProfile(JSON.parse(JSON.stringify(profile)));
        }
      }

      // Sécuriser l'affichage: charger aussi depuis Supabase (si compte réel UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (isUUID) {
        userProfilesSupabase.getModelProfile(user.id).then((remoteProfile) => {
          if (remoteProfile) {
            userStore.setModelProfile(remoteProfile);
            setModelProfile(JSON.parse(JSON.stringify(remoteProfile)));
            if (!isEditing) {
              setSavedModelProfile(JSON.parse(JSON.stringify(remoteProfile)));
            }
          }
        }).catch(() => {
          // no-op
        });
      }
    } else if (user.role === 'PHOTOGRAPHER') {
      const profile = userStore.getPhotographerProfile(user.id);
      if (profile) {
        const profileCopy = JSON.parse(JSON.stringify(profile));
        setPhotographerProfile(profileCopy);
        // Sauvegarder une copie pour la restauration
        if (!isEditing) {
          setSavedPhotographerProfile(JSON.parse(JSON.stringify(profile)));
        }
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (isUUID) {
        userProfilesSupabase.getPhotographerProfile(user.id).then((remoteProfile) => {
          if (remoteProfile) {
            userStore.setPhotographerProfile(remoteProfile);
            setPhotographerProfile(JSON.parse(JSON.stringify(remoteProfile)));
            if (!isEditing) {
              setSavedPhotographerProfile(JSON.parse(JSON.stringify(remoteProfile)));
            }
          }
        }).catch(() => {
          // no-op
        });
      }
    } else if (user.role === 'BRAND') {
      const profile = userStore.getBrandProfile(user.id);
      if (profile) {
        const profileCopy = JSON.parse(JSON.stringify(profile));
        setBrandProfile(profileCopy);
        // Sauvegarder une copie pour la restauration
        if (!isEditing) {
          setSavedBrandProfile(JSON.parse(JSON.stringify(profile)));
        }
      }
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (isUUID) {
        userProfilesSupabase.getBrandProfile(user.id).then((remoteProfile) => {
          if (remoteProfile) {
            userStore.setBrandProfile(remoteProfile);
            setBrandProfile(JSON.parse(JSON.stringify(remoteProfile)));
            if (!isEditing) {
              setSavedBrandProfile(JSON.parse(JSON.stringify(remoteProfile)));
            }
          }
        }).catch(() => {
          // no-op
        });
      }
    }

    // Fallback global: si le rôle est désynchronisé, tenter de récupérer un profil
    // dans les 3 tables puis corriger le rôle local.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (isUUID) {
      Promise.all([
        userProfilesSupabase.getModelProfile(user.id),
        userProfilesSupabase.getPhotographerProfile(user.id),
        userProfilesSupabase.getBrandProfile(user.id),
      ]).then(([model, photographer, brand]) => {
        if (model) {
          userStore.setModelProfile(model);
          setModelProfile(JSON.parse(JSON.stringify(model)));
          return;
        }
        if (photographer) {
          userStore.setPhotographerProfile(photographer);
          setPhotographerProfile(JSON.parse(JSON.stringify(photographer)));
          return;
        }
        if (brand) {
          userStore.setBrandProfile(brand);
          setBrandProfile(JSON.parse(JSON.stringify(brand)));
        }
      }).catch(() => {
        // no-op
      });
    }

    // Charger les annonces de l'utilisateur pour BRAND et PHOTOGRAPHER
    if (user.role === 'BRAND' || user.role === 'PHOTOGRAPHER') {
      loadMyJobs(user.id);
    }

    // Charger les candidatures de l'utilisateur pour MODEL
    if (user.role === 'MODEL') {
      const applications = applicationsStore.getByModelId(user.id);
      // Convertir les dates string en Date objects si nécessaire
      const normalizedApplications = applications.map(app => ({
        ...app,
        createdAt: app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt),
      }));
      setMyApplications(normalizedApplications);
    }
  }, [user, isEditing, loadMyJobs]);

  if (isLoading) {
    return (
      <div className="h-screen bg-beige-50 flex items-center justify-center overflow-hidden">
        <div className="text-neutral-600">Chargement...</div>
      </div>
    );
  }

  if (!user) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Restaurer l'état sauvegardé en rechargeant depuis le store
    if (user?.role === 'MODEL') {
      const profile = userStore.getModelProfile(user.id);
      if (profile) {
        setModelProfile(JSON.parse(JSON.stringify(profile)));
      }
    } else if (user?.role === 'PHOTOGRAPHER') {
      const profile = userStore.getPhotographerProfile(user.id);
      if (profile) {
        setPhotographerProfile(JSON.parse(JSON.stringify(profile)));
      }
    } else if (user?.role === 'BRAND') {
      const profile = userStore.getBrandProfile(user.id);
      if (profile) {
        setBrandProfile(JSON.parse(JSON.stringify(profile)));
      }
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (user.role === 'MODEL' && modelProfile) {
      userStore.setModelProfile(modelProfile);
    } else if (user.role === 'PHOTOGRAPHER' && photographerProfile) {
      userStore.setPhotographerProfile(photographerProfile);
    } else if (user.role === 'BRAND' && brandProfile) {
      userStore.setBrandProfile(brandProfile);
    }
    
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = () => {
    userStore.logout();
    router.push('/auth');
  };


  const handleJobUpdate = () => {
    if (!user) return;
    loadMyJobs(user.id);
  };

  const handleJobDelete = () => {
    if (!user) return;
    loadMyJobs(user.id);
  };

  const handleApplicationDelete = (applicationId: string) => {
    applicationsStore.delete(applicationId);
    if (!user) return;
    const applications = applicationsStore.getByModelId(user.id);
    const normalizedApplications = applications.map(app => ({
      ...app,
      createdAt: app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt),
    }));
    setMyApplications(normalizedApplications);
  };

  const handleSubmitVerification = () => {
    if (!modelProfile || !user) return;
    
    // Vérifier qu'au moins une photo est fournie
    const photos = verificationPhotos.filter(photo => photo.trim().length > 0);
    if (photos.length === 0) {
      alert('Veuillez ajouter au moins une photo de vérification');
      return;
    }

    // Mettre à jour le profil avec la demande de vérification
    const updatedProfile = {
      ...modelProfile,
      verificationStatus: 'PENDING' as const,
      verificationPhotos: photos,
    };
    
    userStore.setModelProfile(updatedProfile);
    setModelProfile(updatedProfile);
    setShowVerificationModal(false);
    setVerificationPhotos(['', '']);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const modelTags: ModelTag[] = ['RUNWAY', 'COMMERCIAL', 'EDITORIAL', 'FITNESS', 'BEAUTY', 'LIFESTYLE', 'E_COMMERCE'];
  const photographerSpecialties: PhotographerSpecialty[] = ['PORTRAIT', 'FASHION', 'STUDIO', 'OUTDOOR', 'WEDDING', 'EVENT', 'PRODUCT'];
  const brandTypes: BrandType[] = ['INDEPENDENT', 'E_COMMERCE', 'AGENCY', 'RETAIL_CHAIN', 'OTHER'];

  return (
    <div className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col animate-fade-in relative backdrop-blur-[0.5px]">
      {/* Pattern décoratif subtil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 25% 35%, #000 1px, transparent 1px),
                          radial-gradient(circle at 75% 65%, #000 1px, transparent 1px)`,
        backgroundSize: '55px 55px',
      }}></div>
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 relative z-10">
        <div className="mx-auto max-w-5xl px-3 sm:px-6 md:px-12 pt-6 sm:pt-12 md:pt-16 pb-6">
          <div className="mb-6 sm:mb-8">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">
              Pour vous
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="font-display mb-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
                  Votre <span className="italic text-beige-700">profil</span>
                </h1>
                <p className="text-sm sm:text-base text-neutral-500">
                  Gérez vos informations et votre visibilité sur MODL
                </p>
              </div>
              <div className="flex items-center justify-start sm:justify-end gap-3 mt-3 sm:mt-0">
                {!isEditing && (
                  <Button variant="outline" onClick={handleEdit} className="border-beige-300 hover:bg-beige-100">
                    Modifier
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout} className="border-beige-300 hover:bg-beige-100">
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>

        {/* Model Profile */}
        {user.role === 'MODEL' && modelProfile && (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Header */}
            <Card className="border-2 border-beige-200 shadow-2xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/30 to-beige-100/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,245,220,0.3),_transparent_70%)] pointer-events-none"></div>
              <CardContent className="p-8 sm:p-10 relative z-10">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex items-center gap-6 flex-1">
                  {modelProfile.avatarUrl ? (
                      <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-beige-300 to-beige-400 blur-xl opacity-50"></div>
                    <img
                      src={modelProfile.avatarUrl}
                      alt={modelProfile.name}
                        className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white shadow-2xl"
                    />
                    </div>
                  ) : (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-beige-300 to-beige-400 blur-xl opacity-50"></div>
                        <div className="relative flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-gradient-to-br from-beige-200 to-beige-300 text-beige-700 text-3xl sm:text-4xl font-bold shadow-2xl ring-4 ring-white">
                      {modelProfile.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                  )}
                  <div>
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-neutral-900 tracking-tight drop-shadow-sm">{modelProfile.name}</h2>
                        {modelProfile.verified && (
                          <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-beige-500 to-beige-600 shadow-[0_4px_12px_rgba(176,176,140,0.4)]">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {(() => {
                          const stats = reviewsStore.getModelStats(modelProfile.userId);
                          if (stats.totalReviews > 0) {
                            return (
                              <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-beige-400 to-beige-500 rounded-full px-2.5 sm:px-4 py-1 sm:py-2 shadow-md">
                                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="text-base sm:text-xl font-bold text-white">{stats.averageRating.toFixed(1)}</span>
                                <span className="text-xs sm:text-sm font-medium text-white">({stats.totalReviews})</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <p className="text-base sm:text-xl text-neutral-700 font-semibold">{modelProfile.city}</p>
                        {modelProfile.age && <p className="text-sm sm:text-lg text-neutral-600 font-medium">{modelProfile.age} ans</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {modelProfile.verified ? (
                      <Badge className="bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-2 border-green-200 w-fit px-4 py-2 text-sm font-semibold shadow-md">
                        ✓ Vérifié
                      </Badge>
                    ) : modelProfile.verificationStatus === 'PENDING' ? (
                      <Badge className="bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-2 border-yellow-200 w-fit px-4 py-2 text-sm font-semibold shadow-md">
                        En attente
                      </Badge>
                    ) : modelProfile.verificationStatus === 'REJECTED' ? (
                      <Badge className="bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-2 border-red-200 w-fit px-4 py-2 text-sm font-semibold shadow-md">
                        Refusé
                      </Badge>
                    ) : (
                      <Button
                        variant="beige"
                        size="sm"
                        onClick={() => setShowVerificationModal(true)}
                        className="shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        Vérification
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="border-2 border-beige-200 shadow-xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/40 to-beige-100/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,245,220,0.2),_transparent_60%)] pointer-events-none"></div>
              <CardHeader className="pb-6 border-b-2 border-beige-200/50 relative z-10">
                <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-8 relative z-10">
                {isEditing ? (
                  <>
                      <div>
                      <ImageUpload
                        images={modelProfile.avatarUrl ? [modelProfile.avatarUrl] : []}
                        onChange={(images) => setModelProfile({ ...modelProfile, avatarUrl: images[0] || '' })}
                        maxImages={1}
                        label="Photo de profil"
                        multiple={false}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Taille (cm)</label>
                        <Input
                          type="number"
                          value={modelProfile.height || ''}
                          onChange={(e) => setModelProfile({ ...modelProfile, height: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Poids (kg)</label>
                        <Input
                          type="number"
                          value={modelProfile.weight || ''}
                          onChange={(e) => setModelProfile({ ...modelProfile, weight: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                      <div>
                        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Yeux</label>
                        <Input
                          value={modelProfile.eyeColor || ''}
                          onChange={(e) => setModelProfile({ ...modelProfile, eyeColor: e.target.value })}
                          placeholder="Bleus, Verts, Marron..."
                        />
                    </div>
                    <div>
                        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Cheveux</label>
                        <Input
                          value={modelProfile.hairColor || ''}
                          onChange={(e) => setModelProfile({ ...modelProfile, hairColor: e.target.value })}
                          placeholder="Blond, Brun, Noir..."
                        />
                      </div>
                      <div>
                        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Longueur cheveux</label>
                        <Input
                          value={modelProfile.hairLength || ''}
                          onChange={(e) => setModelProfile({ ...modelProfile, hairLength: e.target.value })}
                          placeholder="Court, Mi-long, Long..."
                        />
                      </div>
                      <div>
                        <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Teint de peau</label>
                        <Input
                          value={modelProfile.skinTone || ''}
                          onChange={(e) => setModelProfile({ ...modelProfile, skinTone: e.target.value })}
                          placeholder="Clair, Moyen, Foncé..."
                        />
                      </div>
                    </div>
                    
                    {/* Mensurations détaillées en mode édition */}
                    <div className="border-t border-beige-200 pt-4 sm:pt-6">
                      <h4 className="text-sm sm:text-base font-bold text-neutral-900 mb-4 sm:mb-5 tracking-tight">Mensurations détaillées</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Tour de poitrine (cm)</label>
                          <Input
                            type="number"
                            value={modelProfile.bust || ''}
                            onChange={(e) => setModelProfile({ ...modelProfile, bust: parseInt(e.target.value) || undefined })}
                            placeholder="85"
                          />
                        </div>
                        <div>
                          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Tour de taille (cm)</label>
                          <Input
                            type="number"
                            value={modelProfile.waist || ''}
                            onChange={(e) => setModelProfile({ ...modelProfile, waist: parseInt(e.target.value) || undefined })}
                            placeholder="65"
                          />
                        </div>
                        <div>
                          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-neutral-700">Tour de hanches (cm)</label>
                          <Input
                            type="number"
                            value={modelProfile.hips || ''}
                            onChange={(e) => setModelProfile({ ...modelProfile, hips: parseInt(e.target.value) || undefined })}
                            placeholder="90"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-5 mt-5">
                        <div>
                          <label className="mb-3 block text-sm font-semibold text-neutral-700">Pointure</label>
                          <Input
                            type="number"
                            value={modelProfile.shoeSize || ''}
                            onChange={(e) => setModelProfile({ ...modelProfile, shoeSize: parseInt(e.target.value) || undefined })}
                            placeholder="38"
                          />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-semibold text-neutral-700">Taille vêtement</label>
                          <Input
                            value={modelProfile.dressSize || ''}
                            onChange={(e) => setModelProfile({ ...modelProfile, dressSize: e.target.value })}
                            placeholder="36, 38, S, M..."
                          />
                        </div>
                        <div>
                          <label className="mb-3 block text-sm font-semibold text-neutral-700">Tour de bras (cm)</label>
                          <Input
                            type="number"
                            value={modelProfile.armCircumference || ''}
                            onChange={(e) => setModelProfile({ ...modelProfile, armCircumference: parseInt(e.target.value) || undefined })}
                            placeholder="28"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-neutral-700">Bio</label>
                      <textarea
                        className="w-full rounded-2xl border-2 border-beige-200 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:border-black focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] hover:border-beige-300 hover:shadow-sm"
                        rows={4}
                        value={modelProfile.bio || ''}
                        onChange={(e) => setModelProfile({ ...modelProfile, bio: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-neutral-700">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {modelTags.map((tag) => {
                          const isSelected = modelProfile.tags?.includes(tag);
                          return (
                            <Badge
                              key={tag}
                              variant={isSelected ? 'primary' : 'default'}
                              className="cursor-pointer"
                              onClick={() => {
                                const tags = modelProfile.tags || [];
                                if (isSelected) {
                                  setModelProfile({ ...modelProfile, tags: tags.filter(t => t !== tag) });
                                } else {
                                  setModelProfile({ ...modelProfile, tags: [...tags, tag] });
                                }
                              }}
                            >
                              {tag === 'RUNWAY' ? 'Runway' : tag === 'COMMERCIAL' ? 'Commercial' : tag === 'EDITORIAL' ? 'Éditorial' : tag === 'FITNESS' ? 'Fitness' : tag === 'BEAUTY' ? 'Beauté' : tag === 'LIFESTYLE' ? 'Lifestyle' : 'E-commerce'}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mensurations principales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {modelProfile.height && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-beige-100 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0-12l4 4m-4-4l-4 4" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Taille</div>
                            <div className="text-base sm:text-lg font-bold text-neutral-900 truncate">{modelProfile.height} cm</div>
                          </div>
                        </div>
                      )}
                      {modelProfile.weight && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-beige-100 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Poids</div>
                            <div className="text-base sm:text-lg font-bold text-neutral-900 truncate">{modelProfile.weight} kg</div>
                          </div>
                        </div>
                      )}
                      {modelProfile.eyeColor && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-beige-100 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Yeux</div>
                            <div className="text-base sm:text-lg font-bold text-neutral-900 capitalize truncate">{modelProfile.eyeColor}</div>
                          </div>
                        </div>
                      )}
                      {modelProfile.hairColor && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-beige-100 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Cheveux</div>
                            <div className="text-base sm:text-lg font-bold text-neutral-900 capitalize truncate">{modelProfile.hairColor}</div>
                          </div>
                        </div>
                      )}
                      {modelProfile.hairLength && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-beige-100 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                            </svg>
                    </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Longueur</div>
                            <div className="text-base sm:text-lg font-bold text-neutral-900 capitalize truncate">{modelProfile.hairLength}</div>
                          </div>
                        </div>
                      )}
                      {modelProfile.skinTone && (
                        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-beige-100 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Teint</div>
                            <div className="text-base sm:text-lg font-bold text-neutral-900 capitalize truncate">{modelProfile.skinTone}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Mensurations détaillées */}
                    {(modelProfile.bust || modelProfile.waist || modelProfile.hips || modelProfile.shoeSize || modelProfile.dressSize || modelProfile.armCircumference) && (
                      <div className="border-t-2 border-beige-200/50 pt-8 mt-8">
                        <h4 className="text-xl font-bold text-neutral-900 mb-6 tracking-tight flex items-center gap-2">
                          <div className="w-1 h-6 bg-beige-500 rounded-full"></div>
                          Mensurations détaillées
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {modelProfile.bust && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Poitrine</div>
                              <div className="text-base sm:text-lg font-bold text-neutral-900">{modelProfile.bust} cm</div>
                            </div>
                          )}
                          {modelProfile.waist && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Taille</div>
                              <div className="text-base sm:text-lg font-bold text-neutral-900">{modelProfile.waist} cm</div>
                            </div>
                          )}
                          {modelProfile.hips && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Hanches</div>
                              <div className="text-base sm:text-lg font-bold text-neutral-900">{modelProfile.hips} cm</div>
                            </div>
                          )}
                          {modelProfile.shoeSize && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Pointure</div>
                              <div className="text-base sm:text-lg font-bold text-neutral-900">{modelProfile.shoeSize}</div>
                            </div>
                          )}
                          {modelProfile.dressSize && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Vêtement</div>
                              <div className="text-base sm:text-lg font-bold text-neutral-900 truncate">{modelProfile.dressSize}</div>
                            </div>
                          )}
                          {modelProfile.armCircumference && (
                            <div className="p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="text-[10px] sm:text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5 sm:mb-1">Bras</div>
                              <div className="text-base sm:text-lg font-bold text-neutral-900">{modelProfile.armCircumference} cm</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {modelProfile.bio && (
                      <div className="p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                        <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-3">Bio</div>
                        <p className="text-base text-neutral-700 leading-relaxed">{modelProfile.bio}</p>
                      </div>
                    )}
                    {modelProfile.tags && modelProfile.tags.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {modelProfile.tags.map((tag) => (
                          <Badge key={tag} variant="primary" className="px-4 py-2 text-sm font-semibold shadow-md">
                            {tag === 'RUNWAY' ? 'Runway' : tag === 'COMMERCIAL' ? 'Commercial' : tag === 'EDITORIAL' ? 'Éditorial' : tag === 'FITNESS' ? 'Fitness' : tag === 'BEAUTY' ? 'Beauté' : tag === 'LIFESTYLE' ? 'Lifestyle' : 'E-commerce'}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Portfolio */}
            <Card className="border-2 border-beige-200 shadow-xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/40 to-beige-100/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(245,245,220,0.2),_transparent_60%)] pointer-events-none"></div>
              <CardHeader className="pb-6 border-b-2 border-beige-200/50 relative z-10">
                <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Portfolio</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 relative z-10">
                {isEditing ? (
                  <div className="space-y-4">
                    <ImageUpload
                      images={modelProfile.portfolioImages?.filter(img => img.trim()) || []}
                      onChange={(images) => setModelProfile({ ...modelProfile, portfolioImages: images })}
                      maxImages={6}
                      label="Photos de portfolio"
                      multiple={true}
                    />
                  </div>
                ) : (
                  modelProfile.portfolioImages && modelProfile.portfolioImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {modelProfile.portfolioImages.map((img, idx) => (
                        <div 
                        key={idx}
                          className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-beige-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                          onClick={() => {
                            setGalleryImages(modelProfile.portfolioImages || []);
                            setGalleryIndex(idx);
                            setGalleryOpen(true);
                          }}
                        >
                          <img
                        src={img}
                        alt={`Portfolio ${idx + 1}`}
                            className="h-32 sm:h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                        </div>
                    ))}
                  </div>
                ) : (
                    <p className="text-neutral-500 text-base">Aucune photo de portfolio</p>
                  )
                )}
              </CardContent>
            </Card>

            {/* Reviews - Avis reçus */}
            {user?.role === 'MODEL' && (
              <ReviewsList modelUserId={user.id} />
            )}

            {/* Vérification - Section détaillée (uniquement si en attente ou refusé) */}
            {(modelProfile.verificationStatus === 'PENDING' || modelProfile.verificationStatus === 'REJECTED') && (
              <Card className="border-beige-200">
                <CardHeader>
                  <CardTitle className="text-neutral-900">Détails de la vérification</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelProfile.verificationStatus === 'PENDING' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-neutral-700">
                        Votre demande de vérification est en cours d'examen. Nous vous répondrons sous peu.
                      </p>
                      {modelProfile.verificationPhotos && modelProfile.verificationPhotos.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {modelProfile.verificationPhotos.map((photo, idx) => (
                            photo && (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Photo de vérification ${idx + 1}`}
                                className="h-32 w-full rounded-lg object-cover border border-beige-200"
                              />
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-700">
                        Votre demande de vérification a été refusée. Vous pouvez soumettre une nouvelle demande avec de meilleures photos.
                      </p>
                      <Button
                        variant="beige"
                        onClick={() => setShowVerificationModal(true)}
                        className="w-full sm:w-auto"
                      >
                        Nouvelle demande
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mes candidatures */}
            <Card className="border-2 border-beige-200 shadow-md">
              <CardHeader className="pb-5 border-b border-beige-200">
                <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Mes candidatures</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {myApplications.length > 0 ? (
                  <div className="space-y-5">
                    {myApplications.map((application) => {
                      // Récupérer l'annonce correspondante
                      const createdJobs = jobsStore.getAll();
                      const allJobs = [...mockJobPosts, ...createdJobs];
                      const job = allJobs.find((j) => j.id === application.jobId);
                      
                      if (!job) return null;

                      const statusLabels: Record<Application['status'], string> = {
                        PENDING: 'En attente',
                        SHORTLISTED: 'Accepté',
                        REJECTED: 'Refusé',
                        SELECTED: 'Sélectionné',
                      };

                      const statusColors: Record<Application['status'], string> = {
                        PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        SHORTLISTED: 'bg-green-100 text-green-800 border-green-200',
                        REJECTED: 'bg-red-100 text-red-800 border-red-200',
                        SELECTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      };

                      return (
                        <div
                          key={application.id}
                          className="rounded-lg border border-beige-200 bg-white p-3 sm:p-4 transition-all hover:shadow-md w-full max-w-full overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-3 sm:gap-4">
                            {job.referenceImages && job.referenceImages.length > 0 && (
                              <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl ring-2 ring-beige-200">
                                <img
                                  src={job.referenceImages[0]}
                                  alt={job.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                                <Link
                                  href={`/jobs/${job.id}`}
                                  className="font-semibold text-sm sm:text-base text-neutral-900 hover:text-beige-600 transition-colors break-words"
                                >
                                  {job.title}
                                </Link>
                                <Badge
                                  className={cn(
                                    'text-xs font-semibold border flex-shrink-0',
                                    statusColors[application.status]
                                  )}
                                >
                                  {statusLabels[application.status]}
                                </Badge>
                              </div>
                              <div className="mb-2 space-y-1 text-xs sm:text-sm text-neutral-600">
                                <div className="flex items-center gap-2">
                                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{formatDate(job.date)}</span>
                                </div>
                              </div>
                              {application.message && (
                                <p className="mt-2 text-xs sm:text-sm text-neutral-700 line-clamp-2">{application.message}</p>
                              )}
                              <p className="mt-2 text-[10px] sm:text-xs text-neutral-500">
                                Candidature envoyée le {formatDate(application.createdAt)}
                              </p>
                            </div>
                            {application.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApplicationDelete(application.id)}
                                className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 flex-shrink-0 p-1.5 sm:p-2"
                                title="Retirer la candidature"
                              >
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="hidden sm:inline ml-1">Retirer</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">Vous n'avez pas encore postulé à une annonce</p>
                    <Button variant="beige" onClick={() => router.push('/jobs')}>
                      Voir les annonces
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" variant="beige">
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleCancel} className="border-beige-300 hover:bg-beige-100">
                  Annuler
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Photographer Profile */}
        {user.role === 'PHOTOGRAPHER' && photographerProfile && (
          <div className="space-y-6">
            <Card className="border-2 border-beige-200 shadow-2xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/30 to-beige-100/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,245,220,0.3),_transparent_70%)] pointer-events-none"></div>
              <CardContent className="p-8 sm:p-10 relative z-10">
                <div className="flex items-center gap-6">
                  {photographerProfile.avatarUrl ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-beige-300 to-beige-400 blur-xl opacity-50"></div>
                    <img
                      src={photographerProfile.avatarUrl}
                      alt={photographerProfile.name}
                        className="relative h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-2xl"
                    />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-beige-300 to-beige-400 blur-xl opacity-50"></div>
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-beige-200 to-beige-300 text-beige-700 text-4xl font-bold shadow-2xl ring-4 ring-white">
                      {photographerProfile.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div>
                    <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 tracking-tight mb-2 drop-shadow-sm">{photographerProfile.name}</h2>
                    <p className="text-xl text-neutral-700 font-semibold mb-2">{photographerProfile.city}</p>
                    {photographerProfile.creativeType && (
                      <Badge className="bg-beige-100 text-beige-800 border-beige-300 px-3 py-1 text-sm font-semibold">
                        {getCreativeTypeLabel(photographerProfile.creativeType)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-beige-200 shadow-md">
              <CardHeader className="pb-5 border-b border-beige-200">
                <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {isEditing ? (
                  <>
                    <div>
                      <ImageUpload
                        images={photographerProfile.avatarUrl ? [photographerProfile.avatarUrl] : []}
                        onChange={(images) => setPhotographerProfile({ ...photographerProfile, avatarUrl: images[0] || '' })}
                        maxImages={1}
                        label="Photo de profil"
                        multiple={false}
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-neutral-700">Bio</label>
                      <textarea
                        className="w-full rounded-2xl border-2 border-beige-200 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:border-black focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] hover:border-beige-300 hover:shadow-sm"
                        rows={4}
                        value={photographerProfile.bio || ''}
                        onChange={(e) => setPhotographerProfile({ ...photographerProfile, bio: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-neutral-700">Spécialités</label>
                      <div className="flex flex-wrap gap-2">
                        {photographerSpecialties.map((specialty) => {
                          const isSelected = photographerProfile.specialties?.includes(specialty);
                          return (
                            <Badge
                              key={specialty}
                              variant={isSelected ? 'primary' : 'default'}
                              className="cursor-pointer"
                              onClick={() => {
                                const specialties = photographerProfile.specialties || [];
                                if (isSelected) {
                                  setPhotographerProfile({ ...photographerProfile, specialties: specialties.filter(s => s !== specialty) });
                                } else {
                                  setPhotographerProfile({ ...photographerProfile, specialties: [...specialties, specialty] });
                                }
                              }}
                            >
                              {specialty === 'PORTRAIT' ? 'Portrait' : specialty === 'FASHION' ? 'Mode' : specialty === 'STUDIO' ? 'Studio' : specialty === 'OUTDOOR' ? 'Extérieur' : specialty === 'WEDDING' ? 'Mariage' : specialty === 'EVENT' ? 'Événement' : 'Produit'}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {photographerProfile.bio && (
                      <p className="text-neutral-700">{photographerProfile.bio}</p>
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
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-beige-200 shadow-md">
              <CardHeader className="pb-5 border-b border-beige-200">
                <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Galerie</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditing ? (
                  <ImageUpload
                    images={photographerProfile.portfolioImages?.filter(img => img.trim()) || []}
                    onChange={(images) => setPhotographerProfile({ ...photographerProfile, portfolioImages: images })}
                    maxImages={6}
                    label="Photos de galerie"
                    multiple={true}
                  />
                ) : (
                  photographerProfile.portfolioImages && photographerProfile.portfolioImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                    {photographerProfile.portfolioImages.map((img, idx) => (
                        <div 
                        key={idx}
                          className="group relative overflow-hidden rounded-2xl border-2 border-beige-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                          onClick={() => {
                            setGalleryImages(photographerProfile.portfolioImages || []);
                            setGalleryIndex(idx);
                            setGalleryOpen(true);
                          }}
                        >
                          <img
                        src={img}
                        alt={`Portfolio ${idx + 1}`}
                            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                        </div>
                    ))}
                  </div>
                ) : (
                    <p className="text-neutral-500 text-base">Aucune photo de galerie</p>
                  )
                )}
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" variant="beige">
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleCancel} className="border-beige-300 hover:bg-beige-100">
                  Annuler
                </Button>
              </div>
            )}

            {/* Section Mes annonces - Photographe */}
            <Card className="border-2 border-beige-200 shadow-md">
              <CardHeader className="pb-5 border-b border-beige-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Mes annonces</CardTitle>
                  {user && (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                        listingQuota.remaining(user.id) === 0
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-beige-200 bg-beige-50 text-beige-700'
                      }`}>
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {listingQuota.remaining(user.id)} restante{listingQuota.remaining(user.id) !== 1 ? 's' : ''} ce mois
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {myJobs.length > 0 ? (
                  <div className="space-y-5">
                    {myJobs.map((job) => (
                      <MyJobCard
                        key={job.id}
                        job={job}
                        onDelete={handleJobDelete}
                        onUpdate={handleJobUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg text-neutral-500 mb-6 font-medium">Vous n&apos;avez pas encore publie d&apos;annonce</p>
                  </div>
                )}
                {/* CTA monetisation */}
                {user && (
                  <div className="rounded-2xl border border-beige-200 bg-gradient-to-br from-beige-50 to-white p-5 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">Publier &amp; booster</p>
                    <div className="flex flex-wrap gap-3">
                      {listingQuota.remaining(user.id) > 0 ? (
                        <Button variant="beige" size="sm" onClick={() => router.push('/post-job')}>
                          Publier une annonce
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => router.push('/post-job')} className="border-red-200 text-red-600 hover:bg-red-50">
                          Quota atteint — Acheter des credits
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => router.push('/pricing')} className="border-beige-300">
                        Passer en Pro
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Brand Profile */}
        {user.role === 'BRAND' && brandProfile && (
          <div className="space-y-8">
            <Card className="border-2 border-beige-200 shadow-2xl overflow-hidden relative bg-gradient-to-br from-white via-beige-50/30 to-beige-100/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,245,220,0.3),_transparent_70%)] pointer-events-none"></div>
              <CardContent className="p-8 sm:p-10 relative z-10">
                <div className="flex items-center gap-6">
                  {brandProfile.logoUrl ? (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-beige-300 to-beige-400 blur-xl opacity-50"></div>
                    <img
                      src={brandProfile.logoUrl}
                      alt={brandProfile.companyName}
                        className="relative h-32 w-32 rounded-2xl object-cover ring-4 ring-white shadow-2xl"
                    />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-beige-300 to-beige-400 blur-xl opacity-50"></div>
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-beige-200 to-beige-300 text-beige-700 text-4xl font-bold shadow-2xl ring-4 ring-white">
                      {brandProfile.companyName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div>
                    <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 tracking-tight mb-3 drop-shadow-sm">{brandProfile.companyName}</h2>
                    <p className="text-xl text-neutral-700 font-semibold mb-2">{brandProfile.city}</p>
                    {(brandProfile.brandType || brandProfile.website) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        {brandProfile.brandType && (
                          <Badge className="rounded-full border border-beige-300 bg-beige-100/90 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-beige-800 shadow-sm">
                            {getBrandTypeLabel(brandProfile.brandType)}
                          </Badge>
                        )}
                        {brandProfile.website && (
                          <a
                            href={brandProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1.5 rounded-full border border-beige-300/80 bg-white/85 px-3.5 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-all duration-200 hover:border-beige-400 hover:bg-beige-50"
                          >
                            <span className="max-w-[240px] truncate">
                              {brandProfile.website.replace(/^https?:\/\//, '')}
                            </span>
                            <svg
                              className="h-3.5 w-3.5 flex-shrink-0 text-beige-700 transition-transform duration-200 group-hover:translate-x-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6m0 0v6m0-6L10 14" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12v7a2 2 0 002 2h7" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-beige-200 shadow-md">
              <CardHeader className="pb-5 border-b border-beige-200">
                <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {isEditing ? (
                  <>
                    <div>
                      <ImageUpload
                        images={brandProfile.logoUrl ? [brandProfile.logoUrl] : []}
                        onChange={(images) => setBrandProfile({ ...brandProfile, logoUrl: images[0] || '' })}
                        maxImages={1}
                        label="Logo"
                        multiple={false}
                      />
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-neutral-700">Bio</label>
                      <textarea
                        className="w-full rounded-2xl border-2 border-beige-200 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:border-black focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] hover:border-beige-300 hover:shadow-sm"
                        rows={4}
                        value={brandProfile.bio || ''}
                        onChange={(e) => setBrandProfile({ ...brandProfile, bio: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {brandProfile.bio && (
                      <p className="text-neutral-700">{brandProfile.bio}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" variant="beige">
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleCancel} className="border-beige-300 hover:bg-beige-100">
                  Annuler
                </Button>
              </div>
            )}

            {/* Section Mes annonces - Brand */}
            <Card className="border-2 border-beige-200 shadow-md">
              <CardHeader className="pb-5 border-b border-beige-200">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-3xl font-bold text-neutral-900 tracking-tight">Mes annonces</CardTitle>
                  {user && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                      listingQuota.remaining(user.id) === 0
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-beige-200 bg-beige-50 text-beige-700'
                    }`}>
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {listingQuota.remaining(user.id)} restante{listingQuota.remaining(user.id) !== 1 ? 's' : ''} ce mois
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {myJobs.length > 0 ? (
                  <div className="space-y-5 px-1">
                    {myJobs.map((job) => (
                      <MyJobCard
                        key={job.id}
                        job={job}
                        onDelete={handleJobDelete}
                        onUpdate={handleJobUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-lg text-neutral-500 mb-6 font-medium">Vous n&apos;avez pas encore publie d&apos;annonce</p>
                  </div>
                )}
                {/* CTA monetisation */}
                {user && (
                  <div className="rounded-2xl border border-beige-200 bg-gradient-to-br from-beige-50 to-white p-5 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">Publier &amp; booster</p>
                    <div className="flex flex-wrap gap-3">
                      {listingQuota.remaining(user.id) > 0 ? (
                        <Button variant="beige" size="sm" onClick={() => router.push('/post-job')}>
                          Publier une annonce
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => router.push('/post-job')} className="border-red-200 text-red-600 hover:bg-red-50">
                          Quota atteint — Acheter des credits
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => router.push('/pricing')} className="border-beige-300">
                        Passer en Pro
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
      
      {/* Modal de vérification */}
      {user?.role === 'MODEL' && (
        <Modal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setVerificationPhotos(['', '']);
          }}
          title="Demander la vérification"
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-beige-50 p-4">
              <p className="text-sm text-neutral-700 mb-2">
                <strong>Instructions :</strong>
              </p>
              <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
                <li>Prenez une photo de vous tenant votre pièce d'identité (carte d'identité, passeport)</li>
                <li>Assurez-vous que votre visage et les informations de la pièce d'identité sont clairement visibles</li>
                <li>Vous pouvez ajouter jusqu'à 2 photos pour faciliter la vérification</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <ImageUpload
                images={verificationPhotos.filter(img => img.trim())}
                onChange={(images) => {
                  const newPhotos = [...images];
                  while (newPhotos.length < 2) {
                    newPhotos.push('');
                  }
                  setVerificationPhotos(newPhotos.slice(0, 2));
                }}
                maxImages={2}
                label="Photos de vérification (au moins 1 requise)"
                multiple={true}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerificationModal(false);
                  setVerificationPhotos(['', '']);
                }}
                className="border-beige-300 hover:bg-beige-100"
              >
                Annuler
              </Button>
              <Button
                variant="beige"
                onClick={handleSubmitVerification}
              >
                Soumettre la demande
              </Button>
            </div>
          </div>
        </Modal>
      )}
      {showToast && (
        <Toast
          message={modelProfile?.verificationStatus === 'PENDING' ? "Demande de vérification soumise avec succès !" : "Profil sauvegardé avec succès !"}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Galerie Portfolio en plein écran */}
      {galleryOpen && galleryImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setGalleryOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Bouton fermer */}
            <button
              onClick={() => setGalleryOpen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Flèche gauche */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (galleryTransitioning) return;
                  setGalleryTransitioning(true);
                  setTimeout(() => {
                    setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                    setTimeout(() => setGalleryTransitioning(false), 50);
                  }, 150);
                }}
                className="absolute left-4 z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {/* Image */}
            <div 
              className="max-w-7xl max-h-full flex items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImages[galleryIndex]}
                alt={`Portfolio ${galleryIndex + 1}`}
                className={cn(
                  "max-w-full max-h-[90vh] object-contain rounded-lg transition-opacity duration-300",
                  galleryTransitioning ? "opacity-0" : "opacity-100"
                )}
              />
            </div>

            {/* Flèche droite */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (galleryTransitioning) return;
                  setGalleryTransitioning(true);
                  setTimeout(() => {
                    setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                    setTimeout(() => setGalleryTransitioning(false), 50);
                  }, 150);
                }}
                className="absolute right-4 z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-300"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}

            {/* Indicateur de position */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
                <span className="text-white text-sm font-medium">
                  {galleryIndex + 1} / {galleryImages.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
