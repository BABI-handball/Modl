'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BETA_COPY, IS_BETA } from '@/src/lib/beta';

export function BetaBanner() {
  const pathname = usePathname();

  if (!IS_BETA) return null;

  // La landing a déjà son propre messaging hero — bandeau partout ailleurs
  // On l'affiche aussi sur la landing pour la cohérence "partout"
  const isHome = pathname === '/';

  return (
    <div
      className={`relative z-[60] border-b border-beige-300/60 bg-beige-100 text-center ${
        isHome ? 'sticky top-0' : ''
      }`}
      role="status"
    >
      <p className="font-body px-3 py-2 text-[11px] font-medium leading-snug text-neutral-800 sm:text-xs">
        {BETA_COPY.banner}{' '}
        <Link
          href="/pricing"
          className="underline underline-offset-2 decoration-beige-600/50 hover:decoration-beige-700 hover:text-neutral-950"
        >
          En savoir plus
        </Link>
      </p>
    </div>
  );
}
