'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { Application, JobPost, ApplicationStatus, ModelProfile } from '@/src/types';
import { Candidate } from '@/src/types/candidate';
import { mockApplications, mockJobPosts, mockModelProfiles } from '@/src/data/mock';
import { jobsStore } from '@/src/lib/jobs';
import { applicationsStore } from '@/src/lib/applications';
import { applicationsStoreSupabase } from '@/src/lib/applicationsSupabase';
import { messagesStore } from '@/src/lib/messagesStore';
import { userStore } from '@/src/lib/userStore';
import { userProfilesSupabase } from '@/src/lib/userProfilesSupabase';
import { reviewsStore } from '@/src/lib/reviewsStore';
import { ApplicationCard } from '@/src/components/ApplicationCard';
import { SelectedModelCard } from '@/src/components/SelectedModelCard';
import { SwipeDeck } from '@/src/components/swipe/SwipeDeck';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/Tabs';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { transformToCandidates } from '@/src/lib/candidates';

export default function InboxPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHiddenProfiles, setShowHiddenProfiles] = useState(false);
  const loadApplicationsRef = useRef<(() => void) | null>(null);

  // Helper function - doit être définie avant les callbacks qui l'utilisent
  const getModelProfile = useCallback((modelUserId: string): ModelProfile | null => {
    // Chercher d'abord dans userStore (profils créés/seedés)
    const profileFromStore = userStore.getModelProfile(modelUserId);
    if (profileFromStore) {
      return profileFromStore;
    }
    // Fallback mock uniquement pour comptes de démo
    if (modelUserId.startsWith('dev-') || modelUserId.startsWith('user-')) {
      return mockModelProfiles.find((p) => p.userId === modelUserId) || null;
    }
    return null;
  }, []);

  // Charger les candidatures (optimisé pour éviter les re-renders)
  const loadApplications = useCallback(() => {
    if (!user) return;
    
    // Filtrer les candidatures pour les jobs de l'utilisateur (mock + créés)
    const createdJobs = jobsStore.getAll();
    const allJobs = [...mockJobPosts, ...createdJobs];
    const userJobs = allJobs.filter((job) => job.ownerUserId === user.id);
    const userJobIds = userJobs.map(job => job.id);
    
    // Charger depuis localStorage d'abord pour un rendu immédiat
    const storedApplications = applicationsStore.getAll();
    const isUuidUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    const allApplications = isUuidUser ? storedApplications : [...mockApplications, ...storedApplications];
    
    // Filtrer pour ne garder que les candidatures des jobs de l'utilisateur
    const userApplications = allApplications.filter((app) =>
      userJobIds.includes(app.jobId)
    );
    
    // Convertir les dates string en Date objects si nécessaire
    const normalizedApplications = userApplications.map(app => ({
      ...app,
      createdAt: app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt),
    }));
    
    setApplications(normalizedApplications);
    
    // Charger depuis Supabase en arrière-plan pour synchroniser
    setTimeout(async () => {
      try {
        const supabaseApplications = await applicationsStoreSupabase.getAll();
        
        // Filtrer pour les jobs de l'utilisateur
        const supabaseUserApplications = supabaseApplications.filter((app) =>
          userJobIds.includes(app.jobId)
        );
        
        // Fusionner avec les données locales (priorité aux locales)
        const applicationsMap = new Map<string, Application>();
        
        // Ajouter d'abord les applications mock
        mockApplications.forEach(app => {
          if (userJobIds.includes(app.jobId)) {
            applicationsMap.set(app.id, app);
          }
        });
        
        // Ajouter les applications locales (priorité)
        storedApplications.forEach(app => {
          if (userJobIds.includes(app.jobId)) {
            applicationsMap.set(app.id, app);
          }
        });
        
        // Ajouter les applications Supabase (complètent mais n'écrasent pas)
        supabaseUserApplications.forEach(app => {
          if (!applicationsMap.has(app.id)) {
            applicationsMap.set(app.id, app);
          }
        });
        
        // Convertir en array et mettre à jour
        const mergedApplications = Array.from(applicationsMap.values()).map(app => ({
          ...app,
          createdAt: app.createdAt instanceof Date ? app.createdAt : new Date(app.createdAt),
        }));
        
        setApplications(mergedApplications);
      } catch (error) {
        console.warn('Chargement Supabase des candidatures échoué, utilisation des données locales');
      }
    }, 2000); // Délai de 2 secondes pour ne pas bloquer
  }, [user?.id]); // Seulement user.id comme dépendance pour éviter les changements constants

  // Stocker la référence pour éviter les dépendances circulaires
  loadApplicationsRef.current = loadApplications;

  // Charger les candidatures au montage et quand l'utilisateur change
  useEffect(() => {
    if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) {
      return;
    }
    // Utiliser la référence pour éviter les dépendances circulaires
    if (loadApplicationsRef.current) {
      loadApplicationsRef.current();
    }
  }, [user?.id]); // Seulement user.id comme dépendance pour éviter les re-renders constants

  // Écouter les changements dans localStorage
  useEffect(() => {
    if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) {
      return;
    }

    const handleStorageChange = () => {
      if (loadApplicationsRef.current) {
        loadApplicationsRef.current();
      }
      // Forcer la mise à jour des candidats en déclenchant un re-render
      setProfileUpdateTrigger((prev) => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    // Augmenter l'intervalle à 10 secondes pour réduire les re-renders
    const interval = setInterval(handleStorageChange, 10000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user?.id, user?.role]);

  // Précharger les vrais profils candidats depuis Supabase pour fiabiliser les cartes swipe
  useEffect(() => {
    if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) return;
    const candidateIds = Array.from(new Set(applications.map((app) => app.modelUserId))).filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );
    if (candidateIds.length === 0) return;

    Promise.all(candidateIds.map((id) => userProfilesSupabase.getModelProfile(id)))
      .then((profiles) => {
        let updated = false;
        profiles.forEach((profile) => {
          if (profile) {
            userStore.setModelProfile(profile);
            updated = true;
          }
        });
        if (updated) {
          setProfileUpdateTrigger((prev) => prev + 1);
        }
      })
      .catch(() => {
        // no-op
      });
  }, [applications, user?.id, user?.role]);

  // Filtrer les candidatures par statut
  const pendingApps = useMemo(
    () => applications.filter((app) => app.status === 'PENDING'),
    [applications]
  );
  // Shortlist inclut à la fois SHORTLISTED et SELECTED
  const shortlistedApps = useMemo(
    () => applications.filter((app) => app.status === 'SHORTLISTED' || app.status === 'SELECTED'),
    [applications]
  );
  
  // Séparer les profils avec et sans évaluation
  const activeShortlistedApps = useMemo(() => {
    const active = shortlistedApps.filter((app) => !reviewsStore.hasReviewForApplication(app.id));
    console.log('📋 Active shortlisted apps:', active.length);
    return active;
  }, [shortlistedApps, profileUpdateTrigger]);
  
  const hiddenShortlistedApps = useMemo(() => {
    const hidden = shortlistedApps.filter((app) => reviewsStore.hasReviewForApplication(app.id));
    console.log('🔒 Hidden shortlisted apps:', hidden.length, hidden.map(a => a.id));
    return hidden;
  }, [shortlistedApps, profileUpdateTrigger]);
  
  const rejectedApps = useMemo(
    () => applications.filter((app) => app.status === 'REJECTED'),
    [applications]
  );

  // Transformer les candidatures en candidats pour le swipe
  const candidates = useMemo(() => {
    // Récupérer tous les profils de modèles (mock + userStore)
    // Priorité aux profils du store (modifiés) sur les profils mock
    const allModelProfiles: ModelProfile[] = [];
    const processedUserIds = new Set<string>();
    
    // D'abord, récupérer les profils depuis userStore pour chaque candidature (priorité)
    pendingApps.forEach((app) => {
      if (!processedUserIds.has(app.modelUserId)) {
        const profileFromStore = userStore.getModelProfile(app.modelUserId);
        if (profileFromStore) {
          allModelProfiles.push(profileFromStore);
          processedUserIds.add(app.modelUserId);
        }
      }
    });
    
    // Ensuite, ajouter les profils mock qui ne sont pas déjà dans la liste
    mockModelProfiles.forEach((mockProfile) => {
      if (!processedUserIds.has(mockProfile.userId)) {
        allModelProfiles.push(mockProfile);
        processedUserIds.add(mockProfile.userId);
      }
    });
    
    // Récupérer tous les jobs (mock + créés) pour avoir les titres des annonces
    const createdJobs = jobsStore.getAll();
    const allJobs = [...mockJobPosts, ...createdJobs];
    
    return transformToCandidates(pendingApps, allModelProfiles, allJobs);
  }, [pendingApps, profileUpdateTrigger]);

  const handleSwipe = useCallback((applicationId: string, direction: 'left' | 'right') => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? { ...app, status: direction === 'right' ? ('SHORTLISTED' as ApplicationStatus) : ('REJECTED' as ApplicationStatus) }
          : app
      )
    );
  }, []);

  const handleSwipeDeckSwipe = useCallback((applicationId: string, direction: 'left' | 'right') => {
    if (!user) {
      return;
    }
    
    // Mettre à jour l'état local immédiatement pour le feedback visuel
    handleSwipe(applicationId, direction);
    
    // Récupérer les applications à jour depuis le store
    const allApplications = [...mockApplications, ...applicationsStore.getAll()];
    const application = allApplications.find((app) => app.id === applicationId);
    
    if (!application) {
      return;
    }
    
    // Mettre à jour le statut dans le store (qui synchronise avec Supabase)
    const newStatus: ApplicationStatus = direction === 'right' ? 'SHORTLISTED' : 'REJECTED';
    applicationsStore.update(applicationId, { status: newStatus });
    
    // Si swipe droite (like), créer un thread de messagerie
    if (direction === 'right' && (user.role === 'BRAND' || user.role === 'PHOTOGRAPHER')) {
      const createdJobs = jobsStore.getAll();
      const allJobs = [...mockJobPosts, ...createdJobs];
      const job = allJobs.find((j) => j.id === application.jobId);
      
      if (job) {
        try {
          const modelProfile = getModelProfile(application.modelUserId);
          const modelName = modelProfile?.name || '';
          const initialMessage = `Bonjour ${modelName}, votre profil nous intéresse pour "${job.title}". Seriez-vous disponible pour échanger ?`;
          const threadId = messagesStore.getOrCreateThread(
            user.id,
            application.modelUserId,
            job.id,
            initialMessage
          );
          if (threadId) {
            router.push(`/messages/${threadId}`);
            return;
          }
        } catch (error) {
          console.error('Error creating thread:', error);
          router.push('/messages');
          return;
        }
      }
    }
    
    // Rafraîchir les applications après le swipe
    setTimeout(() => {
      if (loadApplicationsRef.current) {
        loadApplicationsRef.current();
      }
    }, 1000);
  }, [user, handleSwipe, getModelProfile]);

  // Fonction pour forcer la mise à jour après une évaluation
  const handleReviewSubmitted = useCallback(() => {
    setProfileUpdateTrigger((prev) => prev + 1);
    if (loadApplicationsRef.current) {
      loadApplicationsRef.current();
    }
  }, []);

  // Bloquer le scroll sur cette page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Masquer la navbar quand le modal est ouvert
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if (navbar) {
      if (isModalOpen) {
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
  }, [isModalOpen]);

  useEffect(() => {
    if (!isLoading && user && user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER') {
      router.replace('/jobs');
    }
  }, [isLoading, user, router]);

  // Early returns APRÈS tous les hooks
  if (isLoading) {
    return (
      <div className="h-screen bg-beige-50 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-12 h-12 border-4 border-beige-200 border-t-beige-600 rounded-full animate-spin mb-4" />
        <div className="text-neutral-600 font-medium">Chargement des candidatures...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col relative backdrop-blur-[0.5px]">
      {/* Pattern décoratif subtil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 35% 25%, #000 1px, transparent 1px),
                          radial-gradient(circle at 65% 75%, #000 1px, transparent 1px)`,
        backgroundSize: '45px 45px',
      }}></div>
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 relative z-10">
        <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">
            Pour vous
          </p>
          <h1 className="font-display mb-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
            Vos <span className="italic text-beige-700">candidatures</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-500">
            Gérez les candidatures pour vos annonces
          </p>
        </div>

        <Tabs defaultValue="swipe" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="swipe">Swipe ({candidates.length})</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlist ({activeShortlistedApps.length})</TabsTrigger>
          </TabsList>

          {(user.role === 'BRAND' || user.role === 'PHOTOGRAPHER') && (
            <TabsContent value="swipe" className="mt-8">
              {candidates.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  }
                  title="Aucune candidature à swiper"
                  description="Les nouvelles candidatures apparaîtront ici"
                />
              ) : (
                <div className="relative h-[700px] rounded-3xl bg-beige-100 overflow-hidden shadow-2xl border-2 border-beige-200">
                  <SwipeDeck
                    key={candidates.map(c => c.applicationId).join(',')}
                    candidates={candidates}
                    onSwipe={(applicationId, direction) => {
                      handleSwipeDeckSwipe(applicationId, direction);
                    }}
                    onFinish={() => {
                      // Optionnel: rediriger ou afficher un message
                    }}
                    onModalOpenChange={setIsModalOpen}
                  />
                </div>
              )}
            </TabsContent>
          )}
          
          <TabsContent value="shortlisted" className="mt-8 space-y-6">
            {shortlistedApps.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="Aucun modèle sélectionné"
                description="Les modèles que vous sélectionnez en swipant à droite apparaîtront ici. Vous pourrez les évaluer après chaque shooting."
              />
            ) : (
              <>
                {/* Profils actifs (non évalués) */}
                {activeShortlistedApps.length > 0 && (
                  <div className="space-y-4">
                    {activeShortlistedApps.map((app) => {
                      const modelProfile = getModelProfile(app.modelUserId);
                      if (!modelProfile) return null;
                      
                      // Récupérer le job associé
                      const createdJobs = jobsStore.getAll();
                      const allJobs = [...mockJobPosts, ...createdJobs];
                      const job = allJobs.find((j) => j.id === app.jobId);
                      
                      return (
                        <SelectedModelCard
                          key={app.id}
                          application={app}
                          modelProfile={modelProfile}
                          job={job}
                          currentUserId={user.id}
                          onReviewSubmitted={handleReviewSubmitted}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Profils masqués (déjà évalués) */}
                {hiddenShortlistedApps.length > 0 && (
                  <div className="mt-8">
                    <button
                      onClick={() => setShowHiddenProfiles(!showHiddenProfiles)}
                      className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-beige-600 transition-colors mb-4"
                    >
                      <svg
                        className={`h-5 w-5 transition-transform ${showHiddenProfiles ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span>
                        Profils évalués ({hiddenShortlistedApps.length})
                      </span>
                    </button>

                    {showHiddenProfiles && (
                      <div className="space-y-4 pl-4 border-l-2 border-beige-200">
                        {hiddenShortlistedApps.map((app) => {
                          const modelProfile = getModelProfile(app.modelUserId);
                          if (!modelProfile) return null;
                          
                          // Récupérer le job associé
                          const createdJobs = jobsStore.getAll();
                          const allJobs = [...mockJobPosts, ...createdJobs];
                          const job = allJobs.find((j) => j.id === app.jobId);
                          
                          return (
                            <SelectedModelCard
                              key={app.id}
                              application={app}
                              modelProfile={modelProfile}
                              job={job}
                              currentUserId={user.id}
                              onReviewSubmitted={handleReviewSubmitted}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}
