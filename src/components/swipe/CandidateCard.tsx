'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Candidate } from '@/src/types/candidate';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { cn } from '@/src/lib/utils';
import { reviewsStore } from '@/src/lib/reviewsStore';

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  total: number;
  onSwipe?: (direction: 'left' | 'right') => void;
  onModalOpenChange?: (isOpen: boolean) => void;
}

const tagLabels: Record<string, string> = {
  RUNWAY: 'Runway',
  COMMERCIAL: 'Commercial',
  EDITORIAL: 'Éditorial',
  FITNESS: 'Fitness',
  BEAUTY: 'Beauté',
  LIFESTYLE: 'Lifestyle',
};

export const CandidateCard = ({ candidate, index, total, onSwipe, onModalOpenChange }: CandidateCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryTransitioning, setGalleryTransitioning] = useState(false);

  // Récupérer les statistiques du modèle
  const modelStats = reviewsStore.getModelStats(candidate.userId);

  const handleModalOpen = (isOpen: boolean) => {
    setShowDetailsModal(isOpen);
    onModalOpenChange?.(isOpen);
  };

  // Bloquer le scroll et gérer la navigation clavier dans la galerie
  useEffect(() => {
    if (!galleryOpen) return;

    // Bloquer le scroll du body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (galleryTransitioning) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setGalleryTransitioning(true);
        setTimeout(() => {
          setGalleryIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
          setTimeout(() => setGalleryTransitioning(false), 50);
        }, 150);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setGalleryTransitioning(true);
        setTimeout(() => {
          setGalleryIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
          setTimeout(() => setGalleryTransitioning(false), 50);
        }, 150);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setGalleryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [galleryOpen, galleryImages.length, galleryTransitioning]);

  const images =
    candidate.portfolioImages.length > 0
      ? candidate.portfolioImages
      : candidate.avatarUrl
      ? [candidate.avatarUrl]
      : [];

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      onSwipe?.(info.offset.x > 0 ? 'right' : 'left');
    }
    setDragDirection(null);
  };

  const handleDrag = (_: any, info: any) => {
    if (Math.abs(info.offset.x) > 50) {
      setDragDirection(info.offset.x > 0 ? 'right' : 'left');
    } else {
      setDragDirection(null);
    }
  };

  const isTopCard = index === 0;
  const scale = 1 - index * 0.05;
  const yOffset = index * 8;
  const opacity = 1 - index * 0.2;

  return (
    <motion.div
      className={cn(
        'absolute inset-0 flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl',
        !isTopCard && 'pointer-events-none'
      )}
      style={{
        scale,
        y: yOffset,
        opacity: Math.max(opacity, 0.3),
        zIndex: total - index,
      }}
      drag={isTopCard ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {/* Image principale avec overlay gradient */}
      <div 
        className="relative h-[60%] overflow-hidden cursor-pointer"
        onClick={(e) => {
          if (isTopCard && !dragDirection) {
            e.stopPropagation();
            handleModalOpen(true);
          }
        }}
      >
        {images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={`${candidate.name} - Photo ${currentImageIndex + 1}`}
              className="h-full w-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-beige-100 to-beige-200">
            <span className="text-sm font-semibold text-neutral-600">Photo indisponible</span>
          </div>
        )}
        
        {/* Gradient overlay subtil pour meilleure lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Nom, âge, ville et pastille de vérification en haut de l'image */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg">
              {candidate.name}
            </h3>
            {candidate.verified && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-beige-500 shadow-lg">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {modelStats.totalReviews > 0 && (
              <div className="flex items-center gap-1 bg-beige-500 backdrop-blur-sm rounded-full px-2.5 py-0.5 shadow-lg">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-sm font-bold text-white">{modelStats.averageRating.toFixed(1)}</span>
                <span className="text-xs font-medium text-white">({modelStats.totalReviews})</span>
              </div>
            )}
            {candidate.age && (
              <span className="text-lg font-normal text-white/90 drop-shadow-md">{candidate.age} ans</span>
            )}
            {candidate.city && (
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4 text-white/90 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg font-normal text-white/90 drop-shadow-md">{candidate.city}</span>
              </div>
            )}
          </div>
          {candidate.jobTitle && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-block">
              <p className="text-sm font-semibold text-neutral-900">
                📋 {candidate.jobTitle}
              </p>
            </div>
          )}
        </div>
        
        {/* Badge LIKE / NOPE pendant le drag */}
        {isTopCard && dragDirection && (
          <motion.div
            className={cn(
              'absolute top-8 left-1/2 -translate-x-1/2 z-20',
              'px-8 py-4 rounded-2xl font-bold text-3xl shadow-2xl',
              dragDirection === 'right' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-600 text-white'
            )}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: dragDirection === 'right' ? 12 : -12 }}
            exit={{ scale: 0 }}
          >
            {dragDirection === 'right' ? 'LIKE' : 'NOPE'}
          </motion.div>
        )}

        {/* Indicateurs de photos - plus discrets */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  idx === currentImageIndex 
                    ? 'w-6 bg-white shadow-sm' 
                    : 'w-1.5 bg-white/60 hover:bg-white/80'
                )}
              />
            ))}
          </div>
        )}

        {/* Boutons navigation images - plus discrets */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white/95 transition-all hover:scale-110"
            >
              <svg className="h-4 w-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/80 backdrop-blur-sm p-2 shadow-md hover:bg-white/95 transition-all hover:scale-110"
            >
              <svg className="h-4 w-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Informations du candidat */}
      <div className="flex-1 flex flex-col justify-start p-5 pt-7 bg-white overflow-hidden">
        <div className="space-y-3.5">
          {/* Mensurations principales avec pictogrammes */}
          <div className="grid grid-cols-3 gap-2">
            {candidate.height && (
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center mb-1.5">
                  <svg className="w-4.5 h-4.5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0-12l4 4m-4-4l-4 4" />
                  </svg>
                </div>
                <div className="text-[10px] font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Taille</div>
                <div className="text-sm font-bold text-neutral-900">{candidate.height} cm</div>
              </div>
            )}
            {candidate.weight && (
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center mb-1.5">
                  <svg className="w-4.5 h-4.5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div className="text-[10px] font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Poids</div>
                <div className="text-sm font-bold text-neutral-900">{candidate.weight} kg</div>
              </div>
            )}
            {candidate.eyeColor && (
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center mb-1.5">
                  <svg className="w-4.5 h-4.5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-[10px] font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Yeux</div>
                <div className="text-xs font-bold text-neutral-900 capitalize">{candidate.eyeColor}</div>
              </div>
            )}
            {candidate.hairColor && (
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center mb-1.5">
                  <svg className="w-4.5 h-4.5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-[10px] font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Cheveux</div>
                <div className="text-xs font-bold text-neutral-900 capitalize">{candidate.hairColor}</div>
              </div>
            )}
            {candidate.hairLength && (
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center mb-1.5">
                  <svg className="w-4.5 h-4.5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <div className="text-[10px] font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Longueur</div>
                <div className="text-xs font-bold text-neutral-900 capitalize">{candidate.hairLength}</div>
              </div>
            )}
            {candidate.skinTone && (
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center mb-1.5">
                  <svg className="w-4.5 h-4.5 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-[10px] font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Teint</div>
                <div className="text-xs font-bold text-neutral-900 capitalize">{candidate.skinTone}</div>
              </div>
            )}
          </div>

          {/* Tags */}
          {candidate.tags && candidate.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="primary" className="text-xs font-semibold px-2.5 py-1">
                  {tagLabels[tag] || tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Bouton pour voir plus (bio et mensurations détaillées) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleModalOpen(true);
            }}
            className="text-xs text-beige-600 font-semibold hover:text-beige-700 transition-colors mt-3 flex items-center gap-1.5 w-full justify-center py-2 rounded-lg hover:bg-beige-50 border border-beige-200"
          >
            Voir la bio et les mensurations détaillées
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal de détails complets */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => handleModalOpen(false)}
        title={`${candidate.name} - Détails complets`}
        className="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Image principale - plus grande */}
          <div 
            className="relative h-96 rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => {
              if (images.length === 0) return;
              setGalleryImages(images);
              setGalleryIndex(currentImageIndex);
              setGalleryOpen(true);
            }}
          >
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={`${candidate.name} - Photo ${currentImageIndex + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-beige-100 to-beige-200">
                <span className="text-sm font-semibold text-neutral-600">Aucune photo fournie</span>
              </div>
            )}
            {/* Overlay avec indication de clic */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm">
                <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
                <span className="text-sm font-semibold text-neutral-700">
                  {images.length > 1 ? `Voir la galerie (${images.length} photos)` : 'Voir en plein écran'}
                </span>
              </div>
            </div>
            {/* Indicateur en bas à droite */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                </svg>
                <span className="text-xs font-semibold text-neutral-700">
                  {currentImageIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>

          {/* Informations complètes */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-neutral-600 mb-4">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold">{candidate.city}</span>
              </div>
            </div>

            {/* Mensurations principales */}
            <div className="grid grid-cols-2 gap-3">
              {candidate.height && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0-12l4 4m-4-4l-4 4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Taille</div>
                    <div className="text-base font-bold text-neutral-900">{candidate.height} cm</div>
                  </div>
                </div>
              )}
              {candidate.weight && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Poids</div>
                    <div className="text-base font-bold text-neutral-900">{candidate.weight} kg</div>
                  </div>
                </div>
              )}
              {candidate.eyeColor && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Yeux</div>
                    <div className="text-base font-bold text-neutral-900 capitalize">{candidate.eyeColor}</div>
                  </div>
                </div>
              )}
              {candidate.hairColor && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Cheveux</div>
                    <div className="text-base font-bold text-neutral-900 capitalize">{candidate.hairColor}</div>
                  </div>
                </div>
              )}
              {candidate.hairLength && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Longueur cheveux</div>
                    <div className="text-base font-bold text-neutral-900 capitalize">{candidate.hairLength}</div>
                  </div>
                </div>
              )}
              {candidate.skinTone && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-beige-200/50 shadow-sm">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-beige-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-0.5">Teint</div>
                    <div className="text-base font-bold text-neutral-900 capitalize">{candidate.skinTone}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Mensurations détaillées */}
            {(candidate.bust || candidate.waist || candidate.hips || candidate.shoeSize || candidate.dressSize || candidate.armCircumference) && (
              <div className="border-t-2 border-beige-200/50 pt-4 mt-4">
                <h4 className="text-base font-bold text-neutral-900 mb-3 tracking-tight flex items-center gap-2">
                  <div className="w-1 h-4 bg-beige-500 rounded-full"></div>
                  Mensurations détaillées
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {candidate.bust && (
                    <div className="text-center p-4 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                      <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-1">Tour de poitrine</div>
                      <div className="text-base font-bold text-neutral-900">{candidate.bust} cm</div>
                    </div>
                  )}
                  {candidate.waist && (
                    <div className="text-center p-4 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                      <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-1">Tour de taille</div>
                      <div className="text-base font-bold text-neutral-900">{candidate.waist} cm</div>
                    </div>
                  )}
                  {candidate.hips && (
                    <div className="text-center p-4 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                      <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-1">Tour de hanches</div>
                      <div className="text-base font-bold text-neutral-900">{candidate.hips} cm</div>
                    </div>
                  )}
                  {candidate.shoeSize && (
                    <div className="text-center p-4 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                      <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-1">Pointure</div>
                      <div className="text-base font-bold text-neutral-900">{candidate.shoeSize}</div>
                    </div>
                  )}
                  {candidate.dressSize && (
                    <div className="text-center p-4 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                      <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-1">Taille vêtement</div>
                      <div className="text-base font-bold text-neutral-900">{candidate.dressSize}</div>
                    </div>
                  )}
                  {candidate.armCircumference && (
                    <div className="text-center p-4 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                      <div className="text-xs font-semibold text-beige-600 uppercase tracking-wide mb-1">Tour de bras</div>
                      <div className="text-base font-bold text-neutral-900">{candidate.armCircumference} cm</div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Tags */}
          {candidate.tags && candidate.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {candidate.tags.map((tag) => (
                  <Badge key={tag} variant="primary" className="text-xs font-semibold px-2.5 py-1">
                  {tagLabels[tag] || tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Bio */}
          {candidate.bio && (
              <div className="p-5 rounded-xl bg-beige-50 border border-beige-200 shadow-sm">
                <div className="text-sm font-bold text-neutral-900 mb-3">Bio</div>
                <p className="text-base text-neutral-700 leading-relaxed">{candidate.bio}</p>
              </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-4 pt-6 border-t border-beige-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModalOpen(false);
                setTimeout(() => {
                  onSwipe?.('left');
                }, 200);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-neutral-300 hover:border-red-400 hover:bg-red-50 transition-all duration-200 font-semibold text-neutral-700 hover:text-red-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rejeter
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleModalOpen(false);
                setTimeout(() => {
                  onSwipe?.('right');
                }, 200);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-beige-500 hover:bg-beige-600 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              Matcher
            </button>
          </div>
        </div>
      </div>
      </Modal>

      {/* Galerie plein écran */}
      {galleryOpen && galleryImages.length > 0 && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setGalleryOpen(false)}
          style={{
            zIndex: 10001,
            position: 'fixed',
          }}
        >
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
            className="w-full h-full flex items-center justify-center relative p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[galleryIndex]}
              alt={`${candidate.name} - Photo ${galleryIndex + 1}`}
              className={cn(
                "max-w-full max-h-full w-auto h-auto object-contain rounded-lg transition-opacity duration-300",
                galleryTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
              }}
              onLoad={() => setGalleryTransitioning(false)}
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
        </div>,
        document.body
      )}
    </motion.div>
  );
};
