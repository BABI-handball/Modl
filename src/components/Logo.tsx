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

// Logo local dans public/
const LOGO_PATH = '/logo-modl.png';

export const Logo = ({ className, size = 'md', showText = false, href, rounded = false }: LogoProps) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-32 w-32', // Très agrandi pour la page d'accueil
    xl: 'h-48 w-48', // Encore plus grand pour la page d'accueil
    '2xl': 'h-64 w-64', // Très très grand pour la page d'accueil
    '3xl': 'h-80 w-80', // Encore plus grand pour la page d'accueil
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
    '3xl': 'text-5xl',
  };

  const imageSize = size === 'sm' ? 32 : size === 'md' ? 48 : size === 'lg' ? 128 : size === 'xl' ? 192 : size === '2xl' ? 256 : 320; // Très agrandi pour 3xl

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      {!imageError ? (
        <Image
          src={LOGO_PATH}
          alt="MODL Logo"
          width={imageSize}
          height={imageSize}
          className={cn('object-contain', sizeClasses[size], rounded && 'rounded-2xl')}
          onError={() => {
            console.warn('Logo image failed to load, using fallback');
            setImageError(true);
          }}
          priority={size === 'lg' || size === 'xl' || size === '2xl' || size === '3xl'}
        />
      ) : (
        <div className={cn('flex items-center justify-center rounded-full bg-black text-white font-bold shadow-md', sizeClasses[size])}>
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
