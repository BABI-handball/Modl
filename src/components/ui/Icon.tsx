'use client';

import { cn } from '@/src/lib/utils';

interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const baseClasses = 'flex-shrink-0';

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const IconJobs = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-label={props['aria-label'] || 'Annonces'}
    aria-hidden={props['aria-hidden']}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export const IconPost = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-label={props['aria-label'] || 'Publier'}
    aria-hidden={props['aria-hidden']}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export const IconInbox = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-label={props['aria-label'] || 'Candidatures'}
    aria-hidden={props['aria-hidden']}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

export const IconMessages = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-label={props['aria-label'] || 'Messages'}
    aria-hidden={props['aria-hidden']}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export const IconProfile = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-label={props['aria-label'] || 'Profil'}
    aria-hidden={props['aria-hidden']}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const IconChevronUp = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden={props['aria-hidden'] ?? true}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

export const IconChevronLeft = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden={props['aria-hidden'] ?? true}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export const IconCheck = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden={props['aria-hidden'] ?? true}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export const IconX = ({ className, size = 'md', ...props }: IconProps) => (
  <svg
    className={cn(baseClasses, sizeClasses[size], className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden={props['aria-hidden'] ?? true}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
