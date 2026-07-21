'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface ConfirmationBadgeProps {
  show: boolean;
  message: string;
  duration?: number;
  className?: string;
}

export const ConfirmationBadge = ({ 
  show, 
  message, 
  duration = 2000,
  className 
}: ConfirmationBadgeProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 z-50 -translate-x-1/2',
        'flex items-center gap-2 rounded-full',
        'bg-green-500 text-white px-4 py-2 shadow-lg',
        'transition-all duration-300',
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95 pointer-events-none',
        className
      )}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="font-semibold text-sm">{message}</span>
    </div>
  );
};
