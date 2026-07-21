'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export const CustomSelect = ({ value, onChange, options, placeholder, className }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={selectRef} className={cn('relative', className)}>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-2xl border-2 border-beige-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige-500/20 focus-visible:border-beige-500 focus-visible:shadow-lg focus-visible:shadow-beige-500/10',
          'hover:border-beige-300 hover:bg-beige-50/50',
          isOpen && 'border-beige-500 bg-beige-50 shadow-lg'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && <span className="text-beige-600">{selectedOption.icon}</span>}
          <span>{selectedOption?.label || placeholder || 'Sélectionner'}</span>
        </div>
        <svg
          className={cn(
            'h-5 w-5 text-neutral-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border-2 border-beige-200 bg-white shadow-2xl overflow-hidden">
          <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-150',
                    'hover:bg-beige-50',
                    isSelected
                      ? 'bg-beige-100 text-neutral-900'
                      : 'text-neutral-700'
                  )}
                >
                  {option.icon && (
                    <span className={cn('flex-shrink-0', isSelected ? 'text-beige-600' : 'text-neutral-400')}>
                      {option.icon}
                    </span>
                  )}
                  <span className="flex-1 text-left">{option.label}</span>
                  {isSelected && (
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-beige-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
