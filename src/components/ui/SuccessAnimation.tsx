'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  className?: string;
}

export const SuccessAnimation = ({ 
  show, 
  message = 'Succès !', 
  onComplete,
  className 
}: SuccessAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/20 backdrop-blur-sm',
        'transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
    >
      <div className="relative">
        {/* Cercle de succès animé */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Cercle externe qui grandit */}
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          {/* Cercle principal */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-xl">
            <svg
              className="h-12 w-12 text-white animate-scale-in"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        {message && (
          <p className="mt-4 text-center text-lg font-semibold text-white drop-shadow-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
