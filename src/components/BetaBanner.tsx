'use client';

import Link from 'next/link';
import { BETA_COPY, IS_BETA } from '@/src/lib/beta';

export function BetaBanner() {
  if (!IS_BETA) return null;

  return (
    <div
      className="beta-banner relative z-[60] shrink-0 border-b border-beige-300/60 bg-beige-100 text-center"
      role="status"
    >
      <p className="font-body px-3 py-2 text-[11px] font-medium leading-snug text-neutral-800 sm:text-xs">
        <span className="sm:hidden">
          Beta · 100 % gratuit ·{' '}
          <Link
            href="/pricing"
            className="underline underline-offset-2 decoration-beige-600/50 hover:decoration-beige-700 hover:text-neutral-950"
          >
            En savoir plus
          </Link>
        </span>
        <span className="hidden sm:inline">
          {BETA_COPY.banner}{' '}
          <Link
            href="/pricing"
            className="underline underline-offset-2 decoration-beige-600/50 hover:decoration-beige-700 hover:text-neutral-950"
          >
            En savoir plus
          </Link>
        </span>
      </p>
    </div>
  );
}
