'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { Application } from '@/src/types';
import { mockJobPosts, mockModelProfiles } from '@/src/data/mock';
import { jobsStore } from '@/src/lib/jobs';
import { applicationsStore } from '@/src/lib/applications';
import { userStore } from '@/src/lib/userStore';
import { ApplicationCard } from '@/src/components/ApplicationCard';
import { EmptyState } from '@/src/components/ui/EmptyState';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

export default function ShortlistPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireUser();
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }
    if (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER') {
      router.push('/jobs');
      return;
    }

    // Charger les candidatures depuis applicationsStore (qui inclut Supabase)
    const createdJobs = jobsStore.getAll();
    const allJobs = [...mockJobPosts, ...createdJobs];
    const userJobs = allJobs.filter((job) => job.ownerUserId === user.id);
    const userJobIds = userJobs.map(job => job.id);
    
    // Récupérer toutes les candidatures et filtrer celles qui sont shortlisted
    const allApplications = applicationsStore.getAll();
    const userApplications = allApplications.filter(
      (app) =>
        app.status === 'SHORTLISTED' &&
        userJobIds.includes(app.jobId)
    );
    
    setApplications(userApplications);
  }, [user, isLoading, router]);

  // Bloquer le scroll sur cette page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-neutral-600">Chargement...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) return null;

  const getModelProfile = (modelUserId: string) => {
    // Chercher d'abord dans userStore (profils créés/seedés)
    const profileFromStore = userStore.getModelProfile(modelUserId);
    if (profileFromStore) {
      return profileFromStore;
    }
    // Fallback sur mock profiles
    return mockModelProfiles.find((p) => p.userId === modelUserId) || null;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col relative backdrop-blur-[0.5px]">
      {/* Pattern décoratif subtil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 40% 30%, #000 1px, transparent 1px),
                          radial-gradient(circle at 60% 70%, #000 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }}></div>
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 relative z-10">
        <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-neutral-900">Shortlist</h1>
            <p className="text-sm text-neutral-600">Vos candidats sélectionnés</p>
          </div>
          <Link href="/inbox">
            <Button variant="outline">Retour aux candidatures</Button>
          </Link>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Aucun candidat dans votre shortlist"
            description="Les candidats que vous sélectionnez apparaîtront ici"
            action={
              <Link href="/inbox">
                <Button>Voir les candidatures</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const modelProfile = getModelProfile(app.modelUserId);
              if (!modelProfile) return null;
              return (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  modelProfile={modelProfile}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
