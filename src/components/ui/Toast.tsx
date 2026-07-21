'use client';

import { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 z-50 -translate-x-1/2 transform flex items-center gap-3 rounded-xl px-5 py-4 shadow-2xl transition-all duration-300 backdrop-blur-sm border',
        {
          'bg-green-500/95 text-white border-green-400/50': type === 'success',
          'bg-red-500/95 text-white border-red-400/50': type === 'error',
          'bg-beige-600/95 text-white border-beige-400/50': type === 'info',
        },
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      )}
      style={{
        animation: isVisible ? 'slideUp 0.3s ease-out' : 'none',
      }}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <span className="font-semibold text-sm sm:text-base">{message}</span>
    </div>
  );
};

interface ToastContainerProps {
  children: ReactNode;
}

export const ToastContainer = ({ children }: ToastContainerProps) => {
  return <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">{children}</div>;
};
