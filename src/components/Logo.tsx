'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/src/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showText?: boolean;
  href?: string;
  rounded?: boolean;
}

// Logo local dans public/ (wordmark recadré — ratio ~363×77)
const LOGO_PATH = '/logo-modl.png';
const LOGO_ASPECT = 77 / 363;

export const Logo = ({ className, size = 'md', showText = false, href, rounded = false }: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  // Largeurs = anciennes boîtes carrées, pour garder la même taille visuelle du wordmark
  const widthBySize = {
    sm: 32,
    md: 48,
    lg: 128,
    xl: 192,
    '2xl': 256,
    '3xl': 320,
  } as const;

  const boxClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-32 w-32',
    xl: 'h-48 w-48',
    '2xl': 'h-64 w-64',
    '3xl': 'h-80 w-80',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl',
  };

  const imageWidth = widthBySize[size];
  const imageHeight = Math.max(1, Math.round(imageWidth * LOGO_ASPECT));

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      {!imageError ? (
        <div className={cn('flex items-center justify-center', boxClasses[size])}>
          <Image
            src={LOGO_PATH}
            alt="MODL Logo"
            width={imageWidth}
            height={imageHeight}
            className={cn('h-auto w-full object-contain', rounded && 'rounded-2xl')}
            onError={() => {
              console.warn('Logo image failed to load, using fallback');
              setImageError(true);
            }}
            priority={size === 'lg' || size === 'xl' || size === '2xl' || size === '3xl'}
          />
        </div>
      ) : (
        <div className={cn('flex items-center justify-center rounded-full bg-black text-white font-bold shadow-md', boxClasses[size])}>
          M
        </div>
      )}
      {showText && (
        <span className={cn('font-bold text-neutral-900 tracking-tight', textSizeClasses[size])}>
          MODL
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
};
