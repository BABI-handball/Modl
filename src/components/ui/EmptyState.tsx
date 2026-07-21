'use client';

import { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  variant?: 'default' | 'minimal' | 'illustrated';
}

export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className,
  variant = 'default'
}: EmptyStateProps) => {
  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 px-4 text-center', className)}>
        {icon && (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-beige-100 text-beige-600">
            {icon}
          </div>
        )}
        <h3 className="mb-1 text-base font-semibold text-neutral-900">{title}</h3>
        {description && <p className="mb-4 max-w-sm text-sm text-neutral-600">{description}</p>}
        {action && <div>{action}</div>}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center animate-fade-in',
      className
    )}>
      {icon && (
        <div className={cn(
          'mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full',
          'bg-gradient-to-br from-beige-100 to-beige-200 text-beige-700',
          'shadow-lg ring-4 ring-beige-50',
          'transition-all duration-300 hover:scale-110 hover:shadow-xl'
        )}>
          <div className="relative">
            {icon}
            {/* Animation de pulse subtile */}
            <div className="absolute inset-0 rounded-full bg-beige-400/20 animate-ping" />
          </div>
        </div>
      )}
      <h3 className="mb-3 text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mb-8 max-w-md text-sm sm:text-base text-neutral-600 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="transition-all duration-300 hover:scale-105">
          {action}
        </div>
      )}
    </div>
  );
};
