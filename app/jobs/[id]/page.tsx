'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { JobPost, Application } from '@/src/types';
import { mockJobPosts, mockBrandProfiles, mockPhotographerProfiles } from '@/src/data/mock';
import { jobsStore } from '@/src/lib/jobs';
import { jobsStoreSupabase } from '@/src/lib/jobsSupabase';
import { applicationsStore } from '@/src/lib/applications';
import { savedJobsStore } from '@/src/lib/savedJobs';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Modal } from '@/src/components/ui/Modal';
import { Toast } from '@/src/components/ui/Toast';
import { OptimizedImage } from '@/src/components/ui/OptimizedImage';
import { ScrollToTop } from '@/src/components/ui/ScrollToTop';
import { formatDate, formatCurrency, getCreativeTypeLabel, getBrandTypeLabel } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import { userStore } from '@/src/lib/userStore';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useRequireUser();
  const [job, setJob] = useState<JobPost | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const hasRedirectedRef = useRef(false);

  const jobId = typeof params.id === 'string' ? params.id : params.id?.[0] || '';

  // Bloquer le scroll sur cette page - DOIT être avant les early returns
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Réinitialiser le flag de redirection quand on change de page
    hasRedirectedRef.current = false;
  }, [jobId]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.push('/auth');
      }
      return;
    }

    const loadJob = async () => {
      // Essayer de charger depuis Supabase d'abord
      let foundJob = await jobsStoreSupabase.getById(jobId);
      
      // Si pas trouvé dans Supabase, chercher dans les annonces mock
      if (!foundJob) {
        const createdJobs = jobsStore.getAll();
        const allJobs = [...mockJobPosts, ...createdJobs];
        foundJob = allJobs.find((j) => j.id === jobId) || null;
      }
      
      if (!foundJob) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.push('/jobs');
        }
        return;
      }
      
      setJob(foundJob);

      // Vérifier si l'utilisateur a déjà postulé
      if (user.role === 'MODEL') {
        const hasAlreadyApplied = applicationsStore.hasApplied(foundJob.id, user.id);
        setHasApplied(hasAlreadyApplied);
        const saved = savedJobsStore.isSaved(foundJob.id, user.id);
        setIsSaved(saved);
      }
    };

    loadJob();
  }, [jobId, user?.id, isLoading]); // Retirer router des dépendances

  // Early return APRÈS tous les hooks
  if (isLoading) {
    return (
      <div className="h-screen bg-beige-50 flex flex-col items-center justify-center overflow-hidden">
        <div className="w-12 h-12 border-4 border-beige-200 border-t-beige-600 rounded-full animate-spin mb-4" />
        <div className="text-neutral-600 font-medium">Chargement de l'annonce...</div>
      </div>
    );
  }

  if (!user || !job) return null;

  const handleSaveToggle = () => {
    if (user.role !== 'MODEL') return;
    const newIsSaved = savedJobsStore.toggle(job.id, user.id);
    setIsSaved(newIsSaved);
  };

  const handleApply = () => {
    if (user.role !== 'MODEL') return;
    setShowApplicationModal(true);
  };

  const handleQuickApply = () => {
    if (!user || !job) return;

    // Créer la candidature rapide sans message
    const newApplication: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId: job.id,
      modelUserId: user.id,
      message: undefined,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Sauvegarder la candidature
    applicationsStore.add(newApplication);

    // Afficher le feedback
    setShowApplicationModal(false);
    setHasApplied(true);
    setApplicationMessage('');
    setToastMessage('Candidature envoyée avec succès !');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSubmitApplication = () => {
    if (!user || !job) return;

    // Créer la candidature avec message optionnel
    const newApplication: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId: job.id,
      modelUserId: user.id,
      message: applicationMessage.trim() || undefined,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Sauvegarder la candidature
    applicationsStore.add(newApplication);

    // Afficher le feedback
    setShowApplicationModal(false);
    setHasApplied(true);
    setApplicationMessage('');
    setToastMessage('Candidature envoyée avec succès !');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Récupérer les infos de l'annonceur (priorité à userStore, puis mock)
  const ownerInfo = job.ownerRole === 'BRAND'
    ? (userStore.getBrandProfile(job.ownerUserId) || mockBrandProfiles.find((p) => p.userId === job.ownerUserId))
    : (userStore.getPhotographerProfile(job.ownerUserId) || mockPhotographerProfiles.find((p) => p.userId === job.ownerUserId));

  return (
    <div className="h-screen bg-beige-50 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden pb-40 sm:pb-28">
        <div className="h-full overflow-y-auto pt-4 sm:pt-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Bouton retour */}
          <button
            onClick={() => router.back()}
            className="mb-3 sm:mb-4 flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>

          {/* Image hero */}
          {job.referenceImages[0] && (
            <div className="mb-3 sm:mb-4 overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl bg-neutral-100">
              <OptimizedImage
                src={job.referenceImages[0]}
                alt={job.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                className="h-[360px] sm:h-[460px] md:h-[560px] lg:h-[600px] xl:h-[640px]"
                objectFit="contain"
                priority
              />
            </div>
          )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* En-tête avec titre et badges */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                  <h1 className="mb-2 sm:mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
                    {job.title}
                  </h1>
                <div className="flex flex-wrap gap-2">
                    {job.isBoosted && job.boostUntil && new Date(job.boostUntil) > new Date() && (
                      <Badge className="text-sm font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white border-0 shadow-lg flex items-center gap-1.5 ring-1 ring-neutral-700/50">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Sponsorisé
                      </Badge>
                    )}
                    {job.isExpressCasting && (
                      <Badge className="text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                        </svg>
                        Casting Express
                      </Badge>
                    )}
                    <Badge variant="primary" className="text-sm font-semibold px-4 py-1.5">
                      {job.type}
                    </Badge>
                  {job.payType === 'PAID' && job.payAmount && (
                      <Badge variant="success" className="text-sm font-semibold px-4 py-1.5">
                        {formatCurrency(job.payAmount)}
                      </Badge>
                  )}
                    {job.payType === 'UNPAID' && (
                      <Badge variant="warning" className="text-sm font-semibold px-4 py-1.5">
                        Collaboration
                      </Badge>
                    )}
                  </div>
                </div>
                {user.role === 'MODEL' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveToggle}
                    className="p-3 hover:bg-beige-100 flex-shrink-0"
                    title={isSaved ? "Retirer des sauvegardes" : "Enregistrer"}
                  >
                    <svg
                      className={cn(
                        "h-6 w-6 transition-colors",
                        isSaved ? "fill-beige-600 text-beige-600" : "text-neutral-400"
                      )}
                      fill={isSaved ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </Button>
                )}
              </div>

              {/* Détails rapides */}
              <Card className={cn(
                "border-2 bg-white",
                job.isExpressCasting 
                  ? "border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-white" 
                  : "border-beige-200"
              )}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row gap-4 items-start flex-wrap">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors flex-shrink-0",
                        job.isExpressCasting 
                          ? "bg-gradient-to-br from-amber-100 to-orange-100" 
                          : "bg-beige-100"
                      )}>
                        <svg className={cn(
                          "h-6 w-6",
                          job.isExpressCasting ? "text-amber-600" : "text-beige-600"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs font-medium uppercase tracking-wide",
                          job.isExpressCasting ? "text-amber-600" : "text-neutral-500"
                        )}>Lieu</p>
                        <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{job.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors flex-shrink-0",
                        job.isExpressCasting 
                          ? "bg-gradient-to-br from-amber-100 to-orange-100" 
                          : "bg-beige-100"
                      )}>
                        <svg className={cn(
                          "h-6 w-6",
                          job.isExpressCasting ? "text-amber-600" : "text-beige-600"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs font-medium uppercase tracking-wide",
                          job.isExpressCasting ? "text-amber-600" : "text-neutral-500"
                        )}>Date</p>
                        <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{formatDate(job.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors flex-shrink-0",
                        job.isExpressCasting 
                          ? "bg-gradient-to-br from-amber-100 to-orange-100" 
                          : "bg-beige-100"
                      )}>
                        <svg className={cn(
                          "h-6 w-6",
                          job.isExpressCasting ? "text-amber-600" : "text-beige-600"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs font-medium uppercase tracking-wide",
                          job.isExpressCasting ? "text-amber-600" : "text-neutral-500"
                        )}>Durée</p>
                        <p className="text-sm font-semibold text-neutral-900 whitespace-nowrap">{job.duration}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Description */}
            <Card className={cn(
              "border-2 bg-white",
              job.isExpressCasting 
                ? "border-amber-200 bg-gradient-to-br from-amber-50/30 via-white to-white" 
                : "border-beige-200"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className={cn(
                  "text-lg sm:text-xl",
                  job.isExpressCasting && "text-amber-900"
                )}>Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm sm:text-base text-neutral-700 whitespace-pre-line leading-relaxed">{job.description}</p>
              </CardContent>
            </Card>


            {/* Images de référence */}
            {job.referenceImages.length > 1 && (
              <Card className="border-beige-200 bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg sm:text-xl">Images de référence</CardTitle>
          </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {job.referenceImages.slice(1).map((img, idx) => (
                      <div key={idx} className="overflow-hidden rounded-2xl shadow-md">
                        <img
                          src={img}
                          alt={`Reference ${idx + 2}`}
                          className="h-48 sm:h-56 w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ))}
              </div>
                </CardContent>
              </Card>
            )}
            </div>

          {/* Colonne latérale */}
          <div className="space-y-4 sm:space-y-5">
            {/* Infos annonceur */}
            {ownerInfo && (
              <Card className="border-beige-200 bg-white sticky top-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base sm:text-lg">
                  {job.ownerRole === 'BRAND' ? 'Marque' : 'Photographe'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <p className="text-base font-bold text-neutral-900">
                  {job.ownerRole === 'BRAND'
                    ? (ownerInfo as typeof mockBrandProfiles[0]).companyName
                    : (ownerInfo as typeof mockPhotographerProfiles[0]).name}
                </p>
                    {job.ownerRole === 'BRAND' && ownerInfo && 'brandType' in ownerInfo && ownerInfo.brandType && (
                      <Badge className="mt-2 bg-beige-100 text-beige-800 border-beige-300 px-2 py-1 text-xs font-semibold">
                        {getBrandTypeLabel(ownerInfo.brandType)}
                      </Badge>
                    )}
                    {job.ownerRole === 'PHOTOGRAPHER' && ownerInfo && 'creativeType' in ownerInfo && ownerInfo.creativeType && (
                      <Badge className="mt-2 bg-beige-100 text-beige-800 border-beige-300 px-2 py-1 text-xs font-semibold">
                        {getCreativeTypeLabel(ownerInfo.creativeType)}
                      </Badge>
                    )}
                    {job.ownerRole === 'BRAND' && ownerInfo && 'website' in ownerInfo && ownerInfo.website && (
                      <a
                        href={ownerInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-beige-600 hover:text-beige-700 hover:underline block"
                      >
                        {ownerInfo.website}
                      </a>
                    )}
              </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">{ownerInfo.bio}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Livrables */}
            <Card className={cn(
              "border-2 bg-white sticky top-4",
              job.isExpressCasting 
                ? "border-amber-200 bg-gradient-to-br from-amber-50/30 via-white to-white" 
                : "border-beige-200"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className={cn(
                  "text-base",
                  job.isExpressCasting && "text-amber-900"
                )}>Livrables</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                {job.deliverables.map((deliverable, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                        job.isExpressCasting 
                          ? "bg-gradient-to-br from-amber-100 to-orange-100" 
                          : "bg-beige-100"
                      )}>
                        <svg className={cn(
                          "h-3 w-3",
                          job.isExpressCasting ? "text-amber-600" : "text-beige-600"
                        )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
            </div>
                      <span className="text-sm text-neutral-700 leading-relaxed">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
                </div>
              </div>

        {/* Bouton postuler en bas en pleine largeur */}
            {user.role === 'MODEL' && (
          <div className="mt-4 sm:mt-6">
            <Card className={cn(
              "border-2 bg-white",
              job.isExpressCasting 
                ? "border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-white shadow-lg" 
                : "border-beige-200"
            )}>
              <CardContent className="p-4 sm:p-5">
                {hasApplied ? (
                  <div className="flex items-center justify-center gap-4 py-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      job.isExpressCasting 
                        ? "bg-gradient-to-br from-amber-100 to-orange-100" 
                        : "bg-beige-100"
                    )}>
                      <svg className={cn(
                        "h-6 w-6",
                        job.isExpressCasting ? "text-amber-600" : "text-beige-600"
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-neutral-900">Candidature envoyée</p>
                      <p className="text-sm text-neutral-600">
                      Votre candidature a été transmise à l'annonceur
                    </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleApply} 
                      className={cn(
                        "w-full transition-all duration-200",
                        job.isExpressCasting && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl"
                      )} 
                      size="lg" 
                      variant={job.isExpressCasting ? "primary" : "beige"}
                    >
                      Postuler à cette annonce
                    </Button>
                    <p className="text-center text-xs text-neutral-500">
                      En postulant, votre profil sera visible par l'annonceur
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
              </div>
            )}
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
            >
              Candidature rapide
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
              >
                Envoyer avec message
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
        </div>
      </div>
    </div>
  );
}
