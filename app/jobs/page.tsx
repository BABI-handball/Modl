'use client';

import { useState, useMemo, useEffect } from 'react';
import { JobPost, JobType, PayType } from '@/src/types';
import { mockJobPosts } from '@/src/data/mock';
import { jobsStore } from '@/src/lib/jobs';
import { jobsStoreSupabase } from '@/src/lib/jobsSupabase';
import { savedJobsStore } from '@/src/lib/savedJobs';
import { JobCard } from '@/src/components/JobCard';
import { JobCardSkeleton } from '@/src/components/ui/JobCardSkeleton';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { CustomSelect } from '@/src/components/ui/CustomSelect';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/Tabs';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Card } from '@/src/components/ui/Card';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { useDebounce } from '@/src/hooks/useDebounce';
import { usePullToRefresh } from '@/src/hooks/usePullToRefresh';
import { cn } from '@/src/lib/utils';
import { mockBrandProfiles, mockPhotographerProfiles } from '@/src/data/mock';
import { applicationsStore } from '@/src/lib/applications';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Modal } from '@/src/components/ui/Modal';
import { Toast } from '@/src/components/ui/Toast';
import { ScrollToTop } from '@/src/components/ui/ScrollToTop';
import { formatDate, formatCurrency, getCreativeTypeLabel, getBrandTypeLabel } from '@/src/lib/utils';
import { userStore } from '@/src/lib/userStore';
import { Application } from '@/src/types';
import { creditsStore } from '@/src/lib/credits';
import { UnlockModal } from '@/src/components/UnlockModal';
import { CreditsDisplay } from '@/src/components/ui/CreditsDisplay';

export default function JobsPage() {
  const { user, isLoading } = useRequireUser();
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedType, setSelectedType] = useState<JobType | 'ALL'>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedDuration, setSelectedDuration] = useState<string>('ALL');
  const [selectedPayType, setSelectedPayType] = useState<PayType | 'ALL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  // Charger depuis localStorage IMMÉDIATEMENT dans l'initialisation du state
  const [allJobs, setAllJobs] = useState<JobPost[]>(() => {
    if (typeof window === 'undefined') return mockJobPosts;
    jobsStore.cleanInappropriate();
    const createdJobs = jobsStore.getAll();
    return [...mockJobPosts, ...createdJobs];
  });
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [forceShowContent, setForceShowContent] = useState(false);
  const [credits, setCredits] = useState(5);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pendingUnlockJobId, setPendingUnlockJobId] = useState<string | null>(null);

  // Timeout de sécurité pour éviter les blocages infinis
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setForceShowContent(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setForceShowContent(false);
    }
  }, [isLoading]);

  // Charger les annonces depuis localStorage IMMÉDIATEMENT (sans attendre Supabase)
  useEffect(() => {
    // Les données sont déjà chargées depuis localStorage dans l'initialisation du state
    setIsLoadingJobs(false);

    if (createdJobId) {
      // Revenir sur un état "global" pour éviter qu'un ancien filtre masque la nouvelle annonce
      setSearchQuery('');
      setSelectedType('ALL');
      setSelectedRegion('ALL');
      setSelectedDuration('ALL');
      setSelectedPayType('ALL');
      setShowSavedOnly(false);
    }

    try {
      const raw = localStorage.getItem('modl_last_created_job');
      if (raw) {
        const lastCreated = JSON.parse(raw);
        if (lastCreated?.id) {
          setAllJobs((prev) => {
            const exists = prev.some((j) => j.id === lastCreated.id);
            if (exists) return prev;
            return [
              {
                ...lastCreated,
                date: new Date(lastCreated.date),
                createdAt: new Date(lastCreated.createdAt),
              },
              ...prev,
            ];
          });
        }
      }
    } catch {
      // no-op
    }
    
    // Charger depuis Supabase en arrière-plan APRÈS un délai pour ne pas bloquer
    setTimeout(async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 2000); // Timeout de 2 secondes
        });
        
        const supabaseJobs = await Promise.race([
          jobsStoreSupabase.getAll(),
          timeoutPromise
        ]);
        
        // Fusionner les données Supabase + locales + état courant au lieu de remplacer
        // pour éviter qu'une annonce fraîchement créée disparaisse après un refresh async.
        jobsStore.cleanInappropriate();
        const localJobs = jobsStore.getAll();
        setAllJobs((prev) => {
          const jobsMap = new Map<string, JobPost>();

          // 1) Conserver d'abord ce qui est déjà visible (état courant)
          prev.forEach((job) => jobsMap.set(job.id, job));

          // 2) Assurer la présence des mocks
          mockJobPosts.forEach((job) => {
            if (!jobsMap.has(job.id)) jobsMap.set(job.id, job);
          });

          // 3) Local prioritaire (écrase supabase si même ID)
          localJobs.forEach((job) => jobsMap.set(job.id, job));

          // 4) Supabase en complément
          supabaseJobs.forEach((job) => {
            if (!jobsMap.has(job.id)) jobsMap.set(job.id, job);
          });

          return Array.from(jobsMap.values());
        });
      } catch (error) {
        // Ignorer les erreurs/timeout - on garde les données locales
        console.warn('Chargement Supabase lent ou échoué, utilisation des données locales');
      }
    }, 2000); // Délai de 2 secondes pour laisser la page se charger complètement
  }, [createdJobId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setCreatedJobId(params.get('createdJobId'));
  }, []);

  // Pull to refresh
  const containerRef = usePullToRefresh({
    onRefresh: async () => {
      setIsLoadingJobs(true);
      try {
        const supabaseJobs = await jobsStoreSupabase.getAll();
        const localJobs = jobsStore.getAll();
        setAllJobs((prev) => {
          const jobsMap = new Map<string, JobPost>();
          prev.forEach((job) => jobsMap.set(job.id, job));
          mockJobPosts.forEach((job) => {
            if (!jobsMap.has(job.id)) jobsMap.set(job.id, job);
          });
          localJobs.forEach((job) => jobsMap.set(job.id, job));
          supabaseJobs.forEach((job) => {
            if (!jobsMap.has(job.id)) jobsMap.set(job.id, job);
          });
          return Array.from(jobsMap.values());
        });
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error);
        jobsStore.cleanInappropriate();
        const createdJobs = jobsStore.getAll();
        setAllJobs((prev) => {
          const jobsMap = new Map<string, JobPost>();
          prev.forEach((job) => jobsMap.set(job.id, job));
          mockJobPosts.forEach((job) => {
            if (!jobsMap.has(job.id)) jobsMap.set(job.id, job);
          });
          createdJobs.forEach((job) => jobsMap.set(job.id, job));
          return Array.from(jobsMap.values());
        });
      } finally {
        setIsLoadingJobs(false);
      }
    },
  });

  // Charger les annonces sauvegardées pour les modèles
  useEffect(() => {
    if (user?.role === 'MODEL') {
      const saved = savedJobsStore.getByModelId(user.id);
      setSavedJobIds(saved);
    }
  }, [user]);

  // Charger les credits MODEL
  useEffect(() => {
    if (user?.role === 'MODEL') {
      setCredits(creditsStore.getCredits(user.id));
    }
  }, [user]);

  // Arrondissements de Paris et principales villes autour de Paris
  const regions = [
    // Arrondissements de Paris
    'Paris 1er',
    'Paris 2e',
    'Paris 3e',
    'Paris 4e',
    'Paris 5e',
    'Paris 6e',
    'Paris 7e',
    'Paris 8e',
    'Paris 9e',
    'Paris 10e',
    'Paris 11e',
    'Paris 12e',
    'Paris 13e',
    'Paris 14e',
    'Paris 15e',
    'Paris 16e',
    'Paris 17e',
    'Paris 18e',
    'Paris 19e',
    'Paris 20e',
    // Départements d'Île-de-France
    'Hauts-de-Seine (92)',
    'Seine-Saint-Denis (93)',
    'Val-de-Marne (94)',
    'Val-d\'Oise (95)',
    'Seine-et-Marne (77)',
    'Yvelines (78)',
    'Essonne (91)',
    // Principales villes autour de Paris
    'Boulogne-Billancourt',
    'Saint-Denis',
    'Argenteuil',
    'Montreuil',
    'Nanterre',
    'Créteil',
    'Aubervilliers',
    'Aulnay-sous-Bois',
    'Asnières-sur-Seine',
    'Colombes',
    'Rueil-Malmaison',
    'Champigny-sur-Marne',
    'Drancy',
    'Antony',
    'Issy-les-Moulineaux',
    'Noisy-le-Grand',
    'Courbevoie',
    'Vitry-sur-Seine',
    'Cergy',
    'Versailles',
    'Levallois-Perret',
    'Neuilly-sur-Seine',
    'Clichy',
    'Pantin',
    'Ivry-sur-Seine',
    'Sarcelles',
    'Bondy',
    'Épinay-sur-Seine',
    'Montrouge',
    'Meaux',
    'Chelles',
    'Évry',
    'Fontenay-sous-Bois',
    'Rosny-sous-Bois',
    'Saint-Maur-des-Fossés',
    'Gennevilliers',
    'Les Lilas',
    'Bagnolet',
    'Bobigny',
    'Vincennes',
    'Charenton-le-Pont',
    'Saint-Ouen',
    'Clamart',
    'Malakoff',
    'Bourg-la-Reine',
    'Châtenay-Malabry',
    'Sceaux',
    'Vanves',
    'Bagneux',
    'Fontenay-aux-Roses',
    'Le Plessis-Robinson',
    'Meudon',
    'Puteaux',
    'Suresnes',
    'Saint-Cloud',
    'Sèvres',
    'Chaville',
    'Vélizy-Villacoublay',
    'Viroflay',
    'Garches',
    'La Garenne-Colombes',
    'Bois-Colombes',
    'Fresnes',
    'Rungis',
    'Thiais',
    'Orly',
    'Villeneuve-le-Roi',
    'Villeneuve-Saint-Georges',
    'Joinville-le-Pont',
    'Nogent-sur-Marne',
    'Le Perreux-sur-Marne',
    'Bry-sur-Marne',
    'Maisons-Alfort',
    'Alfortville',
    'L\'Haÿ-les-Roses',
    'Cachan',
    'Arcueil',
    'Gentilly',
    'Le Kremlin-Bicêtre',
    'Villejuif',
    'Choisy-le-Roi',
    'Boissy-Saint-Léger',
    'Sucy-en-Brie',
    'Chennevières-sur-Marne',
    'Montgeron',
    'Vigneux-sur-Seine',
    'Draveil',
    'Soisy-sur-Seine',
    'Corbeil-Essonnes',
    'Torcy',
    'Lagny-sur-Marne',
    'Noisiel',
    'Pontault-Combault',
    'Roissy-en-Brie',
    'Fontainebleau',
    'Melun'
  ];

  // Durées prédéfinies
  const durations = [
    '1 heure',
    '2 heures',
    '3 heures',
    '4 heures',
    '1 jour',
    '2 jours',
    '3 jours',
    'Plus de 3 jours'
  ];

  const filteredJobs = useMemo(() => {
    const filtered = allJobs.filter((job) => {
      // Filtre "Mes annonces enregistrées"
      if (showSavedOnly && user?.role === 'MODEL') {
        if (!savedJobIds.includes(job.id)) {
          return false;
        }
      }
      
      const matchesSearch =
        job.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesType = selectedType === 'ALL' || job.type === selectedType;
      const matchesRegion =
        selectedRegion === 'ALL' || job.location.toLowerCase().includes(selectedRegion.toLowerCase());
      const matchesPayType = selectedPayType === 'ALL' || job.payType === selectedPayType;
      const matchesDuration =
        selectedDuration === 'ALL' || job.duration === selectedDuration;
      return matchesSearch && matchesType && matchesRegion && matchesPayType && matchesDuration;
    });

    // Trier les annonces : Sponsorisées > Casting Express > Normales
    return filtered.sort((a, b) => {
      const aIsBoosted = a.isBoosted && a.boostUntil && new Date(a.boostUntil) > new Date();
      const bIsBoosted = b.isBoosted && b.boostUntil && new Date(b.boostUntil) > new Date();
      const aIsExpress = a.isExpressCasting;
      const bIsExpress = b.isExpressCasting;
      
      // 1. Annonces boostées en premier
      if (aIsBoosted && !bIsBoosted) return -1;
      if (!aIsBoosted && bIsBoosted) return 1;
      
      // 2. Si ni l'une ni l'autre n'est boostée, prioriser Casting Express
      if (!aIsBoosted && !bIsBoosted) {
        if (aIsExpress && !bIsExpress) return -1;
        if (!aIsExpress && bIsExpress) return 1;
      }
      
      // 3. Si même priorité, trier par date de création (plus récent en premier)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allJobs, debouncedSearchQuery, selectedType, selectedRegion, selectedPayType, selectedDuration, showSavedOnly, savedJobIds, user]);

  // Réinitialiser showDetails quand on change de page ou que selectedJobId change
  useEffect(() => {
    setShowDetails(false);
  }, []);

  // Vérifier que l'annonce sélectionnée existe toujours dans les filtres
  useEffect(() => {
    if (selectedJobId && filteredJobs.length > 0) {
      const jobExists = filteredJobs.some(job => job.id === selectedJobId);
      if (!jobExists) {
        // L'annonce sélectionnée n'existe plus dans les filtres, réinitialiser
        setSelectedJobId(null);
        setShowDetails(false);
      }
    }
  }, [filteredJobs, selectedJobId]);

  // Sélectionner automatiquement la première annonce si aucune n'est sélectionnée (mais ne pas ouvrir les détails)
  useEffect(() => {
    // Attendre que les jobs soient chargés et qu'il y ait des jobs filtrés
    if (!isLoadingJobs && filteredJobs.length > 0 && !selectedJobId) {
      setSelectedJobId(filteredJobs[0].id);
      // Ne pas ouvrir les détails automatiquement - l'utilisateur doit cliquer
    }
  }, [filteredJobs, selectedJobId, isLoadingJobs]);


  // Vérifier si l'utilisateur a déjà postulé à l'annonce sélectionnée
  useEffect(() => {
    if (selectedJobId && user?.role === 'MODEL') {
      const hasAlreadyApplied = applicationsStore.hasApplied(selectedJobId, user.id);
      setHasApplied(hasAlreadyApplied);
      const saved = savedJobsStore.isSaved(selectedJobId, user.id);
      setIsSaved(saved);
    }
  }, [selectedJobId, user]);

  // Écouter les changements dans localStorage (moins fréquemment pour éviter les re-renders)
  useEffect(() => {
    const handleStorageChange = () => {
      const createdJobs = jobsStore.getAll();
      setAllJobs([...mockJobPosts, ...createdJobs]);
    };

    window.addEventListener('storage', handleStorageChange);
    // Augmenté à 15 secondes pour réduire les re-renders constants
    const interval = setInterval(handleStorageChange, 15000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const activeFiltersCount =
    (selectedType !== 'ALL' ? 1 : 0) +
    (selectedRegion !== 'ALL' ? 1 : 0) +
    (selectedPayType !== 'ALL' ? 1 : 0) +
    (selectedDuration !== 'ALL' ? 1 : 0);

  // Bloquer le scroll sur cette page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Early returns APRÈS tous les hooks
  // Ne bloquer que si on charge vraiment (avec un timeout pour éviter les blocages infinis)
  if (isLoading && !forceShowContent) {
    return (
      <div className="h-screen bg-beige-50 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-12 h-12 border-4 border-beige-200 border-t-beige-600 rounded-full animate-spin mb-4" />
        <div className="text-neutral-600 font-medium">Chargement...</div>
      </div>
    );
  }
  
  if (!user) {
    // Ne pas bloquer indéfiniment - laisser useRequireUser gérer la redirection
    return (
      <div className="h-screen bg-beige-50 flex flex-col items-center justify-center overflow-hidden">
        <div className="text-neutral-600 font-medium">Redirection...</div>
      </div>
    );
  }

  // S'assurer que selectedJob existe dans filteredJobs
  const selectedJob = selectedJobId ? filteredJobs.find(job => job.id === selectedJobId) : null;
  
  const ownerInfo = selectedJob ? (selectedJob.ownerRole === 'BRAND'
    ? (userStore.getBrandProfile(selectedJob.ownerUserId) || mockBrandProfiles.find((p) => p.userId === selectedJob.ownerUserId))
    : (userStore.getPhotographerProfile(selectedJob.ownerUserId) || mockPhotographerProfiles.find((p) => p.userId === selectedJob.ownerUserId))) : null;

  const handleApply = () => {
    if (!user || user.role !== 'MODEL') return;
    setShowApplicationModal(true);
  };

  const handleQuickApply = async () => {
    if (!user || !selectedJob || isApplying) return;

    setIsApplying(true);
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 800));

    // Créer la candidature rapide sans message
    const newApplication: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId: selectedJob.id,
      modelUserId: user.id,
      message: undefined,
      status: 'PENDING',
      createdAt: new Date(),
    };

    applicationsStore.add(newApplication);
    setShowApplicationModal(false);
    setHasApplied(true);
    setApplicationMessage('');
    
    setToastMessage('Candidature envoyée avec succès !');
    setShowToast(true);
    setIsApplying(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedJob || isApplying) return;

    setIsApplying(true);
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 800));

    const newApplication: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId: selectedJob.id,
      modelUserId: user.id,
      message: applicationMessage.trim() || undefined,
      status: 'PENDING',
      createdAt: new Date(),
    };

    applicationsStore.add(newApplication);
    setShowApplicationModal(false);
    setHasApplied(true);
    setApplicationMessage('');
    
    setToastMessage('Candidature envoyée avec succès !');
    setShowToast(true);
    setIsApplying(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveToggle = () => {
    if (!user || user.role !== 'MODEL' || !selectedJobId) return;
    const newIsSaved = savedJobsStore.toggle(selectedJobId, user.id);
    setIsSaved(newIsSaved);
    const saved = savedJobsStore.getByModelId(user.id);
    setSavedJobIds(saved);
  };

  const handleUnlockConfirm = () => {
    if (!user || !pendingUnlockJobId) return;
    const success = creditsStore.unlockListing(user.id, pendingUnlockJobId);
    if (success) {
      setCredits(creditsStore.getCredits(user.id));
      setShowUnlockModal(false);
      setSelectedJobId(pendingUnlockJobId);
      setShowDetails(true);
      setPendingUnlockJobId(null);
    }
  };

  // Calcule les IDs des annonces deja debloquees par cet utilisateur
  const unlockedJobIds = user?.role === 'MODEL'
    ? new Set(creditsStore.getUnlockedListings(user.id))
    : new Set<string>();

  const isJobLocked = (job: JobPost) =>
    user?.role === 'MODEL' && job.payType === 'PAID' && !unlockedJobIds.has(job.id);

  return (
    <div ref={containerRef} className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col relative backdrop-blur-[0.5px]">
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Colonne gauche - Liste des annonces */}
        <div className={cn(
          "flex flex-col overflow-hidden bg-transparent transition-all duration-300",
          showDetails ? "w-full md:w-1/2 lg:w-2/5 border-r border-beige-200" : "w-full"
        )}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-40 sm:pb-28">
            <div className={cn(
              "px-3 sm:px-6 md:px-12 pb-6 transition-all duration-300 w-full max-w-full",
              showDetails ? "pt-0 max-w-2xl mx-auto" : "pt-6 sm:pt-0 max-w-5xl mx-auto sm:-mt-16"
            )}>
        <div className={cn("mb-4 sm:mb-6 transition-all duration-300", showDetails && "text-center")}>
          <div className={cn("flex justify-center transition-all duration-300", showDetails ? "mb-1 mt-2" : "mb-0")}>
            <img
              src="/logo-modl.png"
              alt="MODL"
              className={cn("w-auto transition-all duration-300", showDetails ? "h-48 sm:h-64" : "h-48 sm:h-64 md:h-80 lg:h-96")}
            />
          </div>
          <div className={cn("flex items-center gap-3 mb-1 transition-all duration-300", showDetails ? "justify-center" : "justify-start")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">
              {user.role === 'MODEL' ? 'Pour vous' : 'Vos publications'}
            </p>
            {user.role === 'MODEL' && (
              <CreditsDisplay credits={credits} />
            )}
          </div>
          <h1 className={cn("font-display mb-0 font-bold text-neutral-900 tracking-tight transition-all duration-300", showDetails ? "text-2xl sm:text-3xl md:text-4xl text-center" : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-left")}>
            {user.role === 'MODEL' ? (
              <>Vos <span className="italic text-beige-700">annonces</span></>
            ) : (
              <>Vos <span className="italic text-beige-700">castings</span></>
            )}
          </h1>
          <p className={cn("text-neutral-500 transition-all duration-300", showDetails ? "text-sm text-center" : "text-sm sm:text-base text-left")}>
            {user.role === 'MODEL'
              ? 'Découvrez les opportunités qui vous correspondent'
              : 'Gérez et boostez vos annonces publiées'}
          </p>
        </div>
        <div className="mb-6 space-y-4">
          {/* Barre de recherche */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-600 transition-colors duration-300">
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
              placeholder="Rechercher par titre, description, lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>

                  {/* Bouton filtres et Mes annonces enregistrées */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-3 rounded-2xl border-2 border-beige-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-beige-50 hover:border-beige-300 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex h-5 w-5 items-center justify-center">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      </div>
                      <span>Filtres</span>
                      {activeFiltersCount > 0 && (
                        <span className="ml-1 rounded-full bg-beige-500 px-2.5 py-1 text-xs font-bold text-white shadow-[0_2px_4px_rgba(176,176,140,0.25)]">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                    {user?.role === 'MODEL' && (
                      <button
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border-2 px-6 py-3.5 text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5",
                          showSavedOnly
                            ? "border-beige-500 bg-beige-100 text-beige-700"
                            : "border-beige-200 bg-white text-neutral-700 hover:bg-beige-50 hover:border-beige-300"
                        )}
                      >
                        <div className="flex h-5 w-5 items-center justify-center">
                          <svg
                            className={cn("h-5 w-5 transition-colors duration-300", showSavedOnly ? "fill-beige-600 text-beige-600" : "text-neutral-400")}
                            fill={showSavedOnly ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                        </div>
                        <span>Mes annonces enregistrées</span>
                        {savedJobIds.length > 0 && (
                          <span className="ml-1 rounded-full bg-beige-500 px-2.5 py-1 text-xs font-bold text-white shadow-[0_2px_4px_rgba(176,176,140,0.25)]">
                            {savedJobIds.length}
                          </span>
                        )}
                      </button>
                    )}
            {(selectedType !== 'ALL' || selectedRegion !== 'ALL' || selectedPayType !== 'ALL' || selectedDuration !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedType('ALL');
                  setSelectedRegion('ALL');
                  setSelectedPayType('ALL');
                  setSelectedDuration('ALL');
                }}
                className="text-sm font-semibold text-beige-600 hover:text-beige-700 transition-colors duration-300"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <Card className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                  <svg className="h-4 w-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M15 11a3 3 0 11-6 0m6 0a3 3 0 10-6 0m6 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Localisation
                </label>
                <CustomSelect
                  value={selectedRegion}
                  onChange={(value) => setSelectedRegion(value)}
                  options={[
                    {
                      value: 'ALL',
                      label: 'Paris et environs',
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      ),
                    },
                    ...regions.map((region) => ({
                      value: region,
                      label: region,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M15 11a3 3 0 11-6 0m6 0a3 3 0 10-6 0m6 0h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                  <svg className="h-4 w-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Durée
                </label>
                <CustomSelect
                  value={selectedDuration}
                  onChange={(value) => setSelectedDuration(value)}
                  options={[
                    {
                      value: 'ALL',
                      label: 'Toutes les durées',
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      ),
                    },
                    ...durations.map((duration) => ({
                      value: duration,
                      label: duration,
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900 uppercase tracking-wide">
                  <svg className="h-4 w-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Rémunération
                </label>
                <CustomSelect
                  value={selectedPayType}
                  onChange={(value) => setSelectedPayType(value as PayType | 'ALL')}
                  options={[
                    {
                      value: 'ALL',
                      label: 'Tous',
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      ),
                    },
                    {
                      value: 'PAID',
                      label: 'Rémunéré',
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                    },
                    {
                      value: 'UNPAID',
                      label: 'Collaboration',
                      icon: (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ),
                    },
                  ]}
                />
              </div>
            </Card>
          )}

          {/* Filtres par type */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Tabs defaultValue="ALL" value={selectedType} onValueChange={(v) => setSelectedType(v as JobType | 'ALL')}>
              <TabsList className="w-max sm:w-full inline-flex">
                <TabsTrigger value="ALL" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Tous</TabsTrigger>
                <TabsTrigger value="FASHION" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Mode</TabsTrigger>
                <TabsTrigger value="BEAUTY" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Beauté</TabsTrigger>
                <TabsTrigger value="COMMERCIAL" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Commercial</TabsTrigger>
                <TabsTrigger value="EDITORIAL" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Éditorial</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {/* Compteur de résultats */}
        {filteredJobs.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-700">{filteredJobs.length}</span>
            <span className="text-sm text-neutral-400">{filteredJobs.length > 1 ? 'annonces' : 'annonce'}</span>
            {activeFiltersCount > 0 && (
              <span className="text-xs text-beige-600">· filtrées</span>
            )}
          </div>
        )}

        <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-x-hidden py-1 px-1">
          {isLoadingJobs ? (
            // Skeleton loaders pendant le chargement
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="w-full max-w-full px-1">
                <JobCardSkeleton />
              </div>
            ))
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              title="Aucune annonce trouvée"
              description={
                searchQuery || selectedType !== 'ALL' || selectedRegion !== 'ALL' || selectedPayType !== 'ALL' || selectedDuration !== 'ALL'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Il n\'y a pas encore d\'annonces disponibles pour le moment'
              }
            />
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className={cn(
                  "transition-all w-full max-w-full px-1",
                  selectedJobId === job.id && "ring-2 ring-beige-400/70 rounded-2xl shadow-[0_0_0_4px_rgba(176,176,140,0.1)]"
                )}
              >
                <JobCard
                  job={job}
                  isLocked={isJobLocked(job)}
                  onSaveToggle={handleSaveToggle}
                  onClick={() => {
                    if (isJobLocked(job)) {
                      setPendingUnlockJobId(job.id);
                      setShowUnlockModal(true);
                    } else {
                      setSelectedJobId(job.id);
                      setShowDetails(true);
                    }
                  }}
                />
              </div>
            ))
          )}
        </div>
            </div>
          </div>
        </div>

        {/* Colonne droite - Détails de l'annonce */}
        {showDetails && selectedJob && (
            <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col overflow-hidden bg-transparent relative">
              {/* Bouton fermer */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 border border-beige-200 shadow-sm hover:bg-beige-50 hover:border-beige-300 transition-all duration-200 cursor-pointer backdrop-blur-sm"
                title="Fermer les détails"
              >
                <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 pt-6 sm:pt-10">
                <div className="max-w-3xl mx-auto">

                  {/* Hero image avec overlay gradient */}
                  {selectedJob.referenceImages[0] ? (
                    <div className="relative h-52 w-full overflow-hidden">
                      <img
                        src={selectedJob.referenceImages[0]}
                        alt={selectedJob.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      {/* Badges flottants sur l'image */}
                      <div className="absolute bottom-4 left-6 flex flex-wrap gap-1.5">
                        {selectedJob.isBoosted && selectedJob.boostUntil && new Date(selectedJob.boostUntil) > new Date() && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            <svg className="h-2.5 w-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Sponsorisé
                          </span>
                        )}
                        {selectedJob.isExpressCasting && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[10px] font-bold text-white">
                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                            </svg>
                            Casting Express
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-6" />
                  )}

                  <div className="px-6 pt-5 pb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Colonne principale */}
                      <div className="lg:col-span-2 space-y-4">

                        {/* Titre + save */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h1 className="font-display text-xl font-bold text-neutral-900 tracking-tight leading-tight mb-2">
                              {selectedJob.title}
                            </h1>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="primary" className="text-[10px] font-semibold px-2 py-0.5">{selectedJob.type}</Badge>
                              {selectedJob.payType === 'PAID' && selectedJob.payAmount && (
                                <Badge variant="success" className="text-[10px] font-semibold px-2 py-0.5">{formatCurrency(selectedJob.payAmount)}</Badge>
                              )}
                              {selectedJob.payType === 'UNPAID' && (
                                <Badge variant="warning" className="text-[10px] font-semibold px-2 py-0.5">Collaboration</Badge>
                              )}
                            </div>
                          </div>
                          {user.role === 'MODEL' && (
                            <button
                              onClick={handleSaveToggle}
                              className="flex-shrink-0 rounded-xl p-2 hover:bg-beige-100 transition-colors duration-200"
                              title={isSaved ? 'Retirer des sauvegardes' : 'Enregistrer'}
                            >
                              <svg
                                className={cn('h-5 w-5 transition-all duration-200', isSaved ? 'fill-beige-600 text-beige-600' : 'text-neutral-300')}
                                fill={isSaved ? 'currentColor' : 'none'}
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Infos rapides — pills horizontaux */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            {
                              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
                              label: selectedJob.location,
                            },
                            {
                              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
                              label: formatDate(selectedJob.date),
                            },
                            {
                              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                              label: selectedJob.duration,
                            },
                          ].map((item, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-beige-100 bg-beige-50/80 px-3 py-1.5 text-xs font-medium text-neutral-700">
                              <svg className="h-3.5 w-3.5 text-beige-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {item.icon}
                              </svg>
                              {item.label}
                            </span>
                          ))}
                        </div>

                        {/* Description */}
                        <div className={isJobLocked(selectedJob) ? 'relative' : ''}>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Description</p>
                          <p className={`text-sm text-neutral-700 leading-relaxed whitespace-pre-line line-clamp-6 ${isJobLocked(selectedJob) ? 'blur-[5px] select-none' : ''}`}>{selectedJob.description}</p>
                        </div>

                        {/* Images de référence supplémentaires */}
                        {selectedJob.referenceImages.length > 1 && (
                          <div>
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Références</p>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedJob.referenceImages.slice(1, 3).map((img, idx) => (
                                <div key={idx} className="overflow-hidden rounded-xl ring-1 ring-beige-100">
                                  <img
                                    src={img}
                                    alt={`Reference ${idx + 2}`}
                                    className="h-28 w-full object-cover transition-transform duration-300 hover:scale-105"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Colonne latérale */}
                      <div className={`space-y-3 ${isJobLocked(selectedJob) ? 'relative' : ''}`}>
                        {isJobLocked(selectedJob) && (
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 backdrop-blur-sm">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-beige-100">
                              <svg className="h-6 w-6 text-beige-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <p className="text-center text-xs font-semibold text-neutral-700">Details masques</p>
                            <button
                              onClick={() => {
                                setPendingUnlockJobId(selectedJob.id);
                                setShowUnlockModal(true);
                              }}
                              className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-neutral-700"
                            >
                              Debloquer — {credits} credit{credits !== 1 ? 's' : ''}
                            </button>
                          </div>
                        )}
                        {/* Annonceur */}
                        {ownerInfo && (
                          <div className="rounded-2xl border border-beige-100 bg-beige-50/60 p-4 space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                              {selectedJob.ownerRole === 'BRAND' ? 'Marque' : 'Photographe'}
                            </p>
                            <p className="text-sm font-bold text-neutral-900">
                              {selectedJob.ownerRole === 'BRAND'
                                ? (ownerInfo as typeof mockBrandProfiles[0]).companyName
                                : (ownerInfo as typeof mockPhotographerProfiles[0]).name}
                            </p>
                            {selectedJob.ownerRole === 'BRAND' && 'brandType' in ownerInfo && ownerInfo.brandType && (
                              <Badge className="bg-beige-100 text-beige-800 px-2 py-0.5 text-[10px] font-semibold">
                                {getBrandTypeLabel(ownerInfo.brandType)}
                              </Badge>
                            )}
                            {selectedJob.ownerRole === 'PHOTOGRAPHER' && 'creativeType' in ownerInfo && ownerInfo.creativeType && (
                              <Badge className="bg-beige-100 text-beige-800 px-2 py-0.5 text-[10px] font-semibold">
                                {getCreativeTypeLabel(ownerInfo.creativeType)}
                              </Badge>
                            )}
                            {selectedJob.ownerRole === 'BRAND' && 'website' in ownerInfo && ownerInfo.website && (
                              <a
                                href={ownerInfo.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-beige-600 hover:text-beige-700 hover:underline truncate"
                              >
                                {ownerInfo.website}
                              </a>
                            )}
                            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">{ownerInfo.bio}</p>
                          </div>
                        )}

                        {/* Livrables */}
                        <div className="rounded-2xl border border-beige-100 bg-beige-50/60 p-4">
                          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Livrables</p>
                          <ul className="space-y-2">
                            {selectedJob.deliverables.slice(0, 5).map((deliverable, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <svg className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-beige-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs text-neutral-700 leading-relaxed">{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* CTA debloquer pour annonces payantes verouillees */}
                    {user.role === 'MODEL' && isJobLocked(selectedJob) && (
                      <div className="mt-5 rounded-2xl border border-beige-200 bg-beige-50/80 p-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-beige-100 flex-shrink-0">
                            <svg className="h-4 w-4 text-beige-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900">Annonce payante</p>
                            <p className="text-xs text-neutral-500">Utilisez 1 credit pour voir les details et postuler</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setPendingUnlockJobId(selectedJob.id);
                            setShowUnlockModal(true);
                          }}
                          className="w-full"
                          size="md"
                          variant="beige"
                        >
                          Debloquer — {credits} credit{credits !== 1 ? 's' : ''} restant{credits !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                    {/* CTA postuler */}
                    {user.role === 'MODEL' && !isJobLocked(selectedJob) && (
                      <div className="mt-5 rounded-2xl border border-beige-100 bg-white/70 p-4 backdrop-blur-sm">
                        {hasApplied ? (
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-beige-100 flex-shrink-0">
                              <svg className="h-4 w-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-neutral-900">Candidature envoyée</p>
                              <p className="text-xs text-neutral-500">Votre profil a été transmis à l'annonceur</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button onClick={handleApply} className="w-full" size="md" variant="beige" disabled={isApplying}>
                              {isApplying ? (
                                <span className="flex items-center gap-2">
                                  <LoadingSpinner size="sm" color="white" />
                                  Envoi en cours...
                                </span>
                              ) : (
                                'Postuler à cette annonce'
                              )}
                            </Button>
                            <p className="text-center text-xs text-neutral-400">
                              En postulant, votre profil sera visible par l'annonceur
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Modal de deblocage */}
      <UnlockModal
        isOpen={showUnlockModal}
        credits={credits}
        jobTitle={pendingUnlockJobId ? (filteredJobs.find(j => j.id === pendingUnlockJobId)?.title ?? '') : ''}
        onConfirm={handleUnlockConfirm}
        onCancel={() => {
          setShowUnlockModal(false);
          setPendingUnlockJobId(null);
        }}
      />

      {/* Modal de candidature */}
      <Modal
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false);
          setApplicationMessage('');
        }}
        title="Postuler à cette annonce"
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-beige-50 border border-beige-200 p-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-beige-200">
                <svg className="h-5 w-5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-neutral-900 mb-1">Conseils</p>
                <p className="text-neutral-700">Vous pouvez postuler directement ou ajouter un message personnalisé pour vous démarquer.</p>
              </div>
            </div>
          </div>
          
          {/* Bouton candidature rapide */}
          <Button
            onClick={handleQuickApply}
            className="w-full"
            variant="beige"
            size="lg"
            disabled={isApplying}
          >
            {isApplying ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                Envoi en cours...
              </span>
            ) : (
              'Candidature rapide'
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-beige-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">Ou</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Message personnalisé <span className="text-neutral-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              className="w-full rounded-2xl border-2 border-beige-200 bg-white p-4 text-sm focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20 transition-all resize-none"
              rows={6}
              placeholder="Bonjour, je suis très intéressé(e) par ce projet car..."
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
            />
            <p className="mt-2 text-xs text-neutral-500 text-right">
              {applicationMessage.length} caractères
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowApplicationModal(false);
                setApplicationMessage('');
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitApplication}
              className="flex-1"
              variant="beige"
              disabled={isApplying}
            >
              {isApplying ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" color="white" />
                  Envoi...
                </span>
              ) : (
                'Envoyer avec message'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      <ScrollToTop />
    </div>
  );
}
