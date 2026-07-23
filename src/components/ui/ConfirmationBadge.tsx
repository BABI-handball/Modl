'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  className,
}: ConfirmationBadgeProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[200] flex justify-center px-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-[min(92vw,28rem)] items-start gap-2 rounded-full bg-green-500 px-4 py-2.5 text-white shadow-lg transition-all duration-300 sm:items-center',
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-4 scale-95 opacity-0'
        )}
      >
        <svg className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="min-w-0 break-words text-sm font-semibold leading-snug">{message}</span>
      </div>
    </div>,
    document.body
  );
};
