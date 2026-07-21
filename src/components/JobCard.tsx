'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { JobPost } from '@/src/types';
import { Badge } from './ui/Badge';
import { formatDate, formatCurrency } from '@/src/lib/utils';
import { cn } from '@/src/lib/utils';
import { savedJobsStore } from '@/src/lib/savedJobs';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { OptimizedImage } from './ui/OptimizedImage';
import { ConfirmationBadge } from './ui/ConfirmationBadge';

interface JobCardProps {
  job: JobPost;
  onSaveToggle?: () => void;
  onClick?: () => void;
  isLocked?: boolean;
}

export const JobCard = ({ job, onSaveToggle, onClick, isLocked = false }: JobCardProps) => {
  const { user } = useRequireUser();
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  useEffect(() => {
    if (user?.role === 'MODEL') {
      setIsSaved(savedJobsStore.isSaved(job.id, user.id));
    }
  }, [user, job.id]);

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user.role !== 'MODEL') return;

    const newIsSaved = savedJobsStore.toggle(job.id, user.id);
    setIsSaved(newIsSaved);
    setShowSaveConfirmation(true);

    if (onSaveToggle) {
      onSaveToggle();
    }
  };

  const isBoosted = job.isBoosted && job.boostUntil && new Date(job.boostUntil) > new Date();

  const cardContent = (
    <div
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]',
        isBoosted || job.isExpressCasting
          ? 'border-beige-300/80 bg-gradient-to-br from-amber-50/60 via-white to-white shadow-[0_2px_8px_rgba(176,176,140,0.15)]'
          : 'border-beige-200/70 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm'
      )}
      style={{ willChange: 'transform, box-shadow', boxSizing: 'border-box' }}
    >
      {/* Trait accent pour annonces mises en avant */}
      {(isBoosted || job.isExpressCasting) && (
        <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-2xl bg-gradient-to-b from-beige-400 to-beige-300" />
      )}

      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          {/* Image — mobile: en haut, desktop: à droite (order) */}
          {job.referenceImages[0] && (
            <div className={cn(
              'relative flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-beige-100 transition-all duration-300',
              'order-last',
              'h-20 w-20 sm:h-24 sm:w-24',
              'group-hover:ring-beige-300'
            )}>
              <OptimizedImage
                src={job.referenceImages[0]}
                alt={job.title}
                fill
                sizes="96px"
                className="transition-transform duration-500 group-hover:scale-105"
                objectFit="cover"
              />
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                  <svg className="h-5 w-5 text-white/90 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Titre + bouton save */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base sm:text-lg font-bold leading-tight text-neutral-900 group-hover:text-black transition-colors break-words">
                  {job.title}
                </h3>
              </div>
              {user?.role === 'MODEL' && (
                <button
                  onClick={handleSaveToggle}
                  className={cn(
                    'flex-shrink-0 rounded-xl p-1.5 transition-all duration-200 hover:bg-beige-100',
                    isSaved && 'animate-bounce-once'
                  )}
                  title={isSaved ? 'Retirer des sauvegardes' : 'Enregistrer'}
                >
                  <svg
                    className={cn(
                      'h-4 w-4 transition-all duration-200',
                      isSaved ? 'fill-beige-600 text-beige-600 scale-110' : 'text-neutral-300 group-hover:text-neutral-400'
                    )}
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

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isBoosted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <svg className="h-2.5 w-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Sponsorisé
                </span>
              )}
              {job.isExpressCasting && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  Express
                </span>
              )}
              <Badge variant="primary" className="px-2 py-0.5 text-[10px] font-semibold">{job.type}</Badge>
              {job.payType === 'PAID' && job.payAmount && (
                <Badge variant="success" className="px-2 py-0.5 text-[10px] font-semibold">{formatCurrency(job.payAmount)}</Badge>
              )}
              {job.payType === 'UNPAID' && (
                <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-semibold">Collaboration</Badge>
              )}
            </div>

            {/* Meta : lieu, date, durée */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-neutral-600">{job.location}</span>
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(job.date)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.duration}
              </span>
            </div>

            {/* Description courte */}
            <p className={`text-xs text-neutral-500 line-clamp-2 leading-relaxed transition-all duration-200 ${isLocked ? 'select-none blur-[3px]' : ''}`}>
              {job.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <>
        <Link href={`/jobs/${job.id}`} className="block md:hidden w-full">
          {cardContent}
        </Link>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
          }}
          className="hidden md:block w-full"
        >
          {cardContent}
        </div>
        <ConfirmationBadge
          show={showSaveConfirmation}
          message={isSaved ? 'Annonce sauvegardée' : 'Annonce retirée'}
        />
      </>
    );
  }

  return (
    <>
      <Link href={`/jobs/${job.id}`} className="block w-full">
        {cardContent}
      </Link>
      <ConfirmationBadge
        show={showSaveConfirmation}
        message={isSaved ? 'Annonce sauvegardée' : 'Annonce retirée'}
      />
    </>
  );
};
