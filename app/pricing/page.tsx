'use client';

import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';
import { BETA_COPY, IS_BETA } from '@/src/lib/beta';

const CheckIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.2" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const futurePlans = [
  {
    name: 'Gratuit',
    tagline: 'Après la beta',
    monthlyPrice: 0,
    features: [
      '3 annonces par mois',
      'Accès aux candidatures',
      'Profil de base',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    tagline: 'Bientôt',
    monthlyPrice: 29,
    badge: 'À venir',
    features: [
      'Annonces illimitées',
      'Accès prioritaire',
      'Statistiques avancées',
      'Support prioritaire',
      'Swipe des candidatures',
    ],
    highlighted: true,
  },
  {
    name: 'Studio',
    tagline: 'Bientôt',
    monthlyPrice: 99,
    features: [
      "Tout ce qui est dans Pro",
      "Gestion d'équipe multi-sièges",
      'Intégrations sur-mesure',
      'Manager de compte dédié',
      'Rapports personnalisés',
    ],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="relative h-screen overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(212,208,192,0.6) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="group text-neutral-500 hover:text-neutral-900">
              <svg
                className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </Button>
          </Link>
        </div>

        {/* Hero beta */}
        <div className="mb-12 text-center sm:mb-16">
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.2em] text-beige-600">
            {IS_BETA ? 'Beta · Accès gratuit' : 'Tarifs · Paris / Île-de-France'}
          </p>
          <h1 className="font-display mx-auto mb-4 max-w-xl text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
            {IS_BETA ? (
              <>
                {BETA_COPY.pricingHeadline} —{' '}
                <span className="italic text-beige-700">tout est offert</span>
              </>
            ) : (
              <>
                Investissez dans{' '}
                <span className="italic text-beige-700">vos castings</span>
              </>
            )}
          </h1>
          <p className="mx-auto max-w-lg text-base text-neutral-500 sm:text-lg">
            {IS_BETA
              ? BETA_COPY.pricingSub
              : 'Des plans pensés pour vos castings et shootings à Paris et en proche banlieue.'}
          </p>
        </div>

        {IS_BETA && (
          <div className="mb-14 mx-auto max-w-xl rounded-3xl border border-beige-300 bg-beige-50/90 p-8 text-center shadow-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-beige-600">
              Maintenant
            </p>
            <p className="font-display text-3xl font-bold text-neutral-900 mb-3">0€</p>
            <ul className="mb-6 space-y-2 text-sm text-neutral-700 text-left max-w-xs mx-auto">
              {[
                'Annonces illimitées (marques & créatifs)',
                'Crédits illimités pour débloquer les annonces',
                'Swipe, messages, profils — accès complet',
                'Vos retours nous aident à améliorer MODL',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="text-beige-600"><CheckIcon /></span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth" className="block">
              <Button variant="beige" size="md" className="w-full">
                Rejoindre la beta
              </Button>
            </Link>
          </div>
        )}

        {/* Aperçu futurs tarifs */}
        <div className="mb-8 text-center">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-2">
            {IS_BETA ? 'Aperçu des tarifs à venir' : 'Nos plans'}
          </p>
          {IS_BETA && (
            <p className="text-sm text-neutral-500 max-w-md mx-auto">
              Rien à payer pour l&apos;instant. Voici ce qui arrivera après la beta.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch lg:gap-6">
          {futurePlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-300 ease-out sm:p-8 ${
                plan.highlighted
                  ? 'border-beige-400/60 bg-beige-50/90 shadow-[0_8px_32px_rgba(176,176,140,0.25)] backdrop-blur-md md:-translate-y-2 md:scale-[1.02]'
                  : 'border-beige-200/60 bg-white/60 shadow-sm backdrop-blur-sm'
              } ${IS_BETA ? 'opacity-90' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-beige-600">
                  {plan.tagline}
                </p>
                <h2 className="font-display text-2xl font-bold text-neutral-900">{plan.name}</h2>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tracking-tight text-neutral-900">
                    {plan.monthlyPrice}€
                  </span>
                  <span className="text-sm text-neutral-400">/mois</span>
                </div>
                {IS_BETA && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-xs text-neutral-400">Non facturé pendant la beta</p>
                )}
                {plan.monthlyPrice === 0 && (
                  <p className="mt-1 text-xs text-neutral-400">Toujours gratuit</p>
                )}
              </div>

              <div className={`mb-6 h-px ${plan.highlighted ? 'bg-beige-200' : 'bg-beige-100'}`} />

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-neutral-700">
                    <span className={plan.highlighted ? 'text-beige-600' : 'text-neutral-400'}>
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/auth" className="block">
                <Button
                  variant={plan.highlighted ? 'beige' : 'outline'}
                  size="md"
                  className={`w-full ${
                    plan.highlighted ? '' : 'border-beige-200 hover:border-beige-300 hover:bg-beige-50'
                  }`}
                >
                  {IS_BETA ? 'Rejoindre la beta' : 'Commencer'}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center sm:mt-20">
          <p className="mb-8 text-sm text-neutral-400">
            {IS_BETA
              ? `${BETA_COPY.footer} · Annulation à tout moment quand les paiements arriveront`
              : 'Annulation à tout moment'}
          </p>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: '✺', label: 'Mise en ligne en 2 min', sub: 'Publiez votre première annonce immédiatement' },
              { icon: '◎', label: IS_BETA ? 'Beta 100 % gratuite' : 'Paiement sécurisé', sub: IS_BETA ? 'Aucun paiement pour l’instant' : 'Cryptage SSL · Données protégées' },
              { icon: '✶', label: 'Vos retours comptent', sub: 'Écrivez-nous via la FAQ' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-beige-100 bg-white/40 px-4 py-5 backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-beige-200 hover:shadow-sm"
              >
                <div className="mb-1.5 text-2xl">{item.icon}</div>
                <p className="text-sm font-semibold text-neutral-800">{item.label}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
