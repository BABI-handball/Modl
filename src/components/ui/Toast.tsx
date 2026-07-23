'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/src/lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[200] flex justify-center px-4',
        // Au-dessus de la navbar (bottom bar) + safe area iPhone
        'bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-24'
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-[min(92vw,28rem)] items-start gap-3 rounded-xl border px-4 py-3.5 shadow-2xl backdrop-blur-sm transition-all duration-300 sm:items-center sm:px-5 sm:py-4',
          {
            'border-green-400/50 bg-green-500/95 text-white': type === 'success',
            'border-red-400/50 bg-red-500/95 text-white': type === 'error',
            'border-beige-400/50 bg-beige-600/95 text-white': type === 'info',
          },
          isVisible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-4 scale-95 opacity-0'
        )}
      >
        <div className="mt-0.5 flex-shrink-0 sm:mt-0">{icons[type]}</div>
        <span className="min-w-0 flex-1 break-words text-left text-sm font-semibold leading-snug sm:text-base">
          {message}
        </span>
      </div>
    </div>,
    document.body
  );
};

interface ToastContainerProps {
  children: ReactNode;
}

export const ToastContainer = ({ children }: ToastContainerProps) => {
  return <div className="fixed bottom-24 left-1/2 z-[200] -translate-x-1/2">{children}</div>;
};
