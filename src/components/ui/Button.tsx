import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'beige';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          'active:scale-[0.96]',
          'aria-label' in props ? '' : '',
          // Border radius très arrondi
          'rounded-2xl',
          'transform-gpu',
          {
            // Primary - Noir professionnel avec ombre subtile
            'bg-black text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:bg-neutral-800 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:-translate-y-0.5': variant === 'primary',
            // Secondary - Beige doux
            'bg-beige-200 text-neutral-900 shadow-sm hover:bg-beige-300 hover:shadow-md': variant === 'secondary',
            // Beige - Beige foncé pour CTA avec ombre moderne
            'bg-beige-500 text-white shadow-[0_2px_8px_rgba(176,176,140,0.3)] hover:bg-beige-600 hover:shadow-[0_4px_12px_rgba(176,176,140,0.4)] hover:-translate-y-0.5': variant === 'beige',
            // Outline - Bordure noire épaisse avec hover subtil
            'border-2 border-black bg-transparent text-black hover:bg-beige-50 hover:border-neutral-800 hover:shadow-sm': variant === 'outline',
            // Ghost - Subtile
            'text-neutral-700 hover:bg-beige-100': variant === 'ghost',
            // Destructive - Rouge moderne
            'bg-red-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:bg-red-700 hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:-translate-y-0.5': variant === 'destructive',
          },
          {
            'h-9 px-4 text-sm': size === 'sm',
            'h-12 px-6 text-base': size === 'md',
            'h-14 px-8 text-lg': size === 'lg',
          },
          // Les classes personnalisées en dernier pour surcharger via twMerge
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
