'use client';

import { BETA_COPY, IS_BETA } from '@/src/lib/beta';

interface CreditsDisplayProps {
  credits: number;
  className?: string;
  showLabel?: boolean;
}

export const CreditsDisplay = ({ credits, className = '', showLabel = true }: CreditsDisplayProps) => {
  if (IS_BETA) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border-2 border-beige-400 bg-beige-100 px-3 py-1.5 text-sm font-bold text-beige-900 shadow-sm ${className}`}
        title={BETA_COPY.creditsLabel}
      >
        <svg className="h-4 w-4 flex-shrink-0 text-beige-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
        </svg>
        {showLabel ? (
          <span className="leading-none text-beige-800">{BETA_COPY.creditsLabel}</span>
        ) : (
          <span className="text-base leading-none">∞</span>
        )}
      </div>
    );
  }

  const isEmpty = credits === 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-bold shadow-sm transition-all duration-200 ${
        isEmpty
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-beige-400 bg-beige-100 text-beige-900'
      } ${className}`}
      title={`${credits} credit${credits !== 1 ? 's' : ''} restant${credits !== 1 ? 's' : ''} cette semaine`}
    >
      <svg
        className={`h-4 w-4 flex-shrink-0 ${isEmpty ? 'text-red-600' : 'text-beige-700'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
      </svg>
      <span className="text-base leading-none">{credits}</span>
      {showLabel && (
        <span className={`leading-none ${isEmpty ? 'text-red-700' : 'text-beige-800'}`}>
          crédit{credits !== 1 ? 's' : ''} restant{credits !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};
