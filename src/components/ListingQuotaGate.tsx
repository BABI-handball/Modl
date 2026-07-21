'use client';

import Link from 'next/link';

interface CreditPack {
  id: string;
  listings: number;
  price: number;
  popular?: boolean;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack3', listings: 3, price: 9 },
  { id: 'pack10', listings: 10, price: 25, popular: true },
];

interface ListingQuotaGateProps {
  resetLabel: string;
  onBuyCredits: (pack: CreditPack) => void;
  isBuying?: boolean;
}

export const ListingQuotaGate = ({
  resetLabel,
  onBuyCredits,
  isBuying = false,
}: ListingQuotaGateProps) => {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-beige-200 shadow-[0_8px_48px_rgba(0,0,0,0.08)]">

      {/* ── Hero éditorial sombre ── */}
      <div className="relative overflow-hidden bg-[#12110f] px-8 py-12 sm:px-12 sm:py-16 text-center">
        {/* Watermark 0 */}
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display font-bold text-white select-none"
          style={{ fontSize: 'clamp(10rem, 30vw, 22rem)', opacity: 0.03, lineHeight: 1 }}
          aria-hidden
        >
          0
        </span>

        {/* Halo lumineux centré */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,240,232,0.12) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 space-y-4">
          {/* Label magazine */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-beige-600">
            MODL · Quota mensuel
          </p>

          {/* Titre principal */}
          <h2
            className="font-display font-bold text-white"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Limite atteinte.<br />
            <span className="italic text-beige-400">Continue a poster.</span>
          </h2>

          {/* Reset info */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <svg className="h-3.5 w-3.5 text-beige-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-beige-300 font-medium">
              Quota gratuit rechargé {resetLabel}
            </span>
          </div>
        </div>

        {/* Ligne decorative bas */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* ── Corps : offres ── */}
      <div className="bg-[#faf9f7] px-6 py-8 sm:px-10 sm:py-10 space-y-8">

        {/* Section credits */}
        <div>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Annonces supplementaires
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => onBuyCredits(pack)}
                disabled={isBuying}
                className={`group relative flex flex-col rounded-2xl border-2 px-5 py-6 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                  pack.popular
                    ? 'border-neutral-900 bg-neutral-900 shadow-[0_4px_24px_rgba(0,0,0,0.18)]'
                    : 'border-beige-200 bg-white hover:border-beige-400 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-4 rounded-full bg-beige-400 px-3 py-0.5 text-[10px] font-bold text-neutral-900 shadow-sm">
                    Meilleur rapport
                  </span>
                )}

                {/* Nombre d'annonces */}
                <span
                  className={`font-display font-bold leading-none mb-1 ${pack.popular ? 'text-white' : 'text-neutral-900'}`}
                  style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)' }}
                >
                  {pack.listings}
                </span>
                <span className={`text-xs mb-4 ${pack.popular ? 'text-beige-400' : 'text-neutral-400'}`}>
                  annonce{pack.listings > 1 ? 's' : ''}
                </span>

                {/* Prix */}
                <div className="mt-auto">
                  <span className={`text-xl font-bold ${pack.popular ? 'text-beige-300' : 'text-neutral-800'}`}>
                    {pack.price}€
                  </span>
                  <span className={`ml-1.5 text-[11px] ${pack.popular ? 'text-beige-600' : 'text-neutral-400'}`}>
                    · {(pack.price / pack.listings).toFixed(0)}€ /annonce
                  </span>
                </div>

                {/* Fleche hover */}
                <svg
                  className={`absolute bottom-5 right-5 h-4 w-4 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 ${pack.popular ? 'text-beige-400' : 'text-neutral-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Divider editorial */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-beige-200" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold">ou</span>
          <div className="flex-1 h-px bg-beige-200" />
        </div>

        {/* Plan Pro — carte mise en avant */}
        <Link
          href="/pricing"
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border-2 border-beige-300 bg-gradient-to-br from-beige-50 via-white to-white px-6 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-beige-500 hover:shadow-[0_8px_32px_rgba(176,176,140,0.2)]"
        >
          {/* Halo fond */}
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-1/3 translate-x-1/4 rounded-full bg-beige-200/40 blur-2xl" />

          <div className="relative z-10 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600 mb-0.5">
              Abonnement
            </p>
            <p className="text-base font-bold text-neutral-900 mb-0.5">Plan Pro</p>
            <p className="text-xs text-neutral-500">Annonces illimitees · Boost · Statistiques · Support prioritaire</p>
          </div>

          <div className="relative z-10 flex items-end gap-1 ml-4 flex-shrink-0">
            <span className="font-display text-3xl font-bold text-neutral-900 leading-none">29€</span>
            <span className="text-xs text-neutral-400 mb-1">/mois</span>
          </div>

          {/* Fleche */}
          <svg
            className="relative z-10 ml-3 h-5 w-5 flex-shrink-0 text-beige-500 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        {/* Lien retour discret */}
        <div className="text-center pt-1">
          <Link
            href="/jobs"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors duration-200 inline-flex items-center gap-1.5"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux annonces
          </Link>
        </div>

      </div>
    </div>
  );
};

export type { CreditPack };
