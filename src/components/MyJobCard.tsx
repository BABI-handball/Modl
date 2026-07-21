'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JobPost } from '@/src/types';
import { CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { formatDate, formatCurrency, cn } from '@/src/lib/utils';
import { jobsStore } from '@/src/lib/jobs';
import { Modal } from './ui/Modal';
import { EditJobForm } from './EditJobForm';
import { BoostModal } from './BoostModal';

interface MyJobCardProps {
  job: JobPost;
  onDelete: () => void;
  onUpdate: () => void;
}

export const MyJobCard = ({ job, onDelete, onUpdate }: MyJobCardProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  const isBoostActive = job.isBoosted && job.boostUntil && new Date(job.boostUntil) > new Date();

  const handleDelete = () => {
    jobsStore.delete(job.id);
    onDelete();
    setShowDeleteModal(false);
  };

  const handleUpdate = () => {
    onUpdate();
    setShowEditModal(false);
  };

  const typeLabels: Record<string, string> = {
    FASHION: 'Mode',
    BEAUTY: 'Beauté',
    COMMERCIAL: 'Commercial',
    EDITORIAL: 'Éditorial',
    OTHER: 'Autre',
  };

  return (
    <>
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl border transition-all duration-300 ease-out',
          'hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]',
          isBoostActive
            ? 'border-beige-300/80 bg-gradient-to-br from-amber-50/60 via-white to-white shadow-[0_2px_8px_rgba(176,176,140,0.15)]'
            : 'border-beige-200/70 bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm'
        )}
        style={{ willChange: 'transform, box-shadow', boxSizing: 'border-box' }}
      >
        {isBoostActive && (
          <div className="absolute left-0 top-0 h-full w-0.5 rounded-l-2xl bg-gradient-to-b from-beige-400 to-beige-300" />
        )}

        <CardContent className="p-4 sm:p-5">
          <div className="flex gap-4">
            {job.referenceImages[0] && (
              <div className="relative order-last h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-beige-100 transition-all duration-300 group-hover:ring-beige-300 sm:h-24 sm:w-24">
                <img
                  src={job.referenceImages[0]}
                  alt={job.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Titre + actions */}
              <div className="flex items-start justify-between gap-2">
                <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                  <h3 className="font-display text-base sm:text-lg font-bold leading-tight text-neutral-900 group-hover:text-black transition-colors break-words">
                    {job.title}
                  </h3>
                </Link>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant={isBoostActive ? 'outline' : 'beige'}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isBoostActive) setShowBoostModal(true);
                    }}
                    disabled={!!isBoostActive}
                    className={cn('h-8 w-8 p-0', isBoostActive && 'cursor-not-allowed opacity-60')}
                    title={isBoostActive ? `Boosté jusqu'au ${formatDate(job.boostUntil!)}` : 'Booster cette annonce'}
                  >
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                    className="h-8 w-8 p-0 border-beige-200 hover:bg-beige-50 hover:border-beige-300"
                    title="Modifier"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                    className="h-8 w-8 p-0 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    title="Supprimer"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                {isBoostActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <svg className="h-2.5 w-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Boosté
                  </span>
                )}
                <Badge variant="primary" className="px-2 py-0.5 text-[10px] font-semibold">
                  {typeLabels[job.type] || job.type}
                </Badge>
                {job.payType === 'PAID' && job.payAmount && (
                  <Badge variant="success" className="px-2 py-0.5 text-[10px] font-semibold">
                    {formatCurrency(job.payAmount)}
                  </Badge>
                )}
                {job.payType === 'UNPAID' && (
                  <Badge variant="warning" className="px-2 py-0.5 text-[10px] font-semibold">
                    Collaboration
                  </Badge>
                )}
              </div>

              {/* Meta */}
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

              {/* Description */}
              <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{job.description}</p>
            </div>
          </div>
        </CardContent>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer l'annonce">
        <div className="space-y-4">
          <p className="text-neutral-700">
            Êtes-vous sûr de vouloir supprimer <strong>"{job.title}"</strong> ? Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="border-beige-300 hover:bg-beige-100">
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier l'annonce" className="max-w-2xl">
        <EditJobForm job={job} onSave={handleUpdate} onCancel={() => setShowEditModal(false)} />
      </Modal>

      <BoostModal
        isOpen={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        job={job}
        onBoostSuccess={() => {
          onUpdate();
          setShowBoostModal(false);
        }}
      />
    </>
  );
};
