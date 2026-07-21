'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
}

export const ScrollToTop = ({ threshold = 300, className }: ScrollToTopProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > threshold || document.documentElement.scrollTop > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed bottom-24 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-beige-600 text-white shadow-lg transition-all duration-300 hover:bg-beige-700 hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-beige-500 focus:ring-offset-2',
        className
      )}
      aria-label="Retour en haut de la page"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
};
