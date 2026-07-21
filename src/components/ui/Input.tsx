import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    const isDateInput = type === 'date';

    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Design moderne avec transitions fluides
          'flex h-12 w-full rounded-2xl border-2 border-beige-200 bg-white px-4 py-3',
          'text-base text-neutral-900 placeholder:text-neutral-400',
          'transition-all duration-300 ease-out',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10',
          'focus-visible:border-black focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]',
          'hover:border-beige-300 hover:shadow-sm',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-beige-50 disabled:border-beige-200',
          isDateInput && 'modl-date-input cursor-pointer pr-12 font-semibold tracking-tight',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
