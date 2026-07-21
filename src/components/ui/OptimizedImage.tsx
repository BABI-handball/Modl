'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/src/lib/utils';
import { Skeleton } from './Skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  priority = false,
  sizes,
  objectFit = 'cover',
  onError,
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Si c'est une data URL (base64), utiliser img natif
  const isDataUrl = src.startsWith('data:');
  
  // Pour l'instant, utiliser img natif pour toutes les URLs externes pour éviter les problèmes
  // On peut réactiver next/image plus tard si nécessaire
  const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');
  
  // Utiliser img natif pour data URLs et URLs externes
  if (isDataUrl || isExternalUrl) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full', className)}
        style={{ objectFit }}
        onError={onError}
        loading="lazy"
      />
    );
  }

  if (hasError) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100 text-gray-400', className)}>
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  // Pour les fichiers locaux (public/), utiliser next/image
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <Skeleton
          className="absolute inset-0 z-10"
          variant="rectangular"
          animation="pulse"
        />
      )}
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          priority={priority}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            `object-${objectFit}`
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width || 400}
          height={height || 300}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          priority={priority}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            `object-${objectFit}`
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
          }}
        />
      )}
    </div>
  );
};
