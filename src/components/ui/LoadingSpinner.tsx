'use client';

import { cn } from '@/src/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'beige' | 'white' | 'black';
}

export const LoadingSpinner = ({ 
  size = 'md', 
  className,
  color = 'beige' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const colorClasses = {
    beige: 'border-beige-200 border-t-beige-600',
    white: 'border-white/20 border-t-white',
    black: 'border-gray-200 border-t-gray-900',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Chargement"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
};
