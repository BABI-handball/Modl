'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';

const CheckIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.2" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const plans = [
  {
    name: 'Gratuit',
    tagline: 'Pour commencer',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '5 annonces par mois',
      'Accès aux candidatures',
      'Profil de base',
    ],
    cta: 'Commencer gratuitement',
    ctaVariant: 'outline' as const,
    highlighted: false,
  },
  {
    name: 'Pro',
    tagline: 'Le plus populaire',
    monthlyPrice: 29,
    yearlyPrice: 23,
    badge: 'Populaire',
    features: [
      'Annonces illimitées',
      'Accès prioritaire',
      'Statistiques avancées',
      'Support prioritaire',
      'Swipe des candidatures',
    ],
    cta: 'Choisir Pro',
    ctaVariant: 'beige' as const,
    highlighted: true,
  },
  {
    name: 'Studio',
    tagline: 'Pour les grandes équipes',
    monthlyPrice: 99,
    yearlyPrice: 79,
    features: [
      'Tout ce qui est dans Pro',
      'Gestion d\'équipe multi-sièges',
      'Intégrations sur-mesure',
      'Manager de compte dédié',
      'Rapports personnalisés',
    ],
    cta: 'Nous contacter',
    ctaVariant: 'outline' as const,
    highlighted: false,
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    // Conteneur plein écran avec son propre scroll vertical pour s'assurer que
    // tout le contenu des cartes tarifs reste lisible, même sur petits écrans.
    <div className="relative h-screen overflow-y-auto">
      {/* Fond décoratif */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(212,208,192,0.6) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(176,176,140,0.5) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        {/* Bouton retour */}
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

        {/* En-tête éditorial */}
        <div className="mb-12 text-center sm:mb-16">
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.2em] text-beige-600">
            Tarifs · Paris / Île-de-France
          </p>
          <h1 className="font-display mx-auto mb-4 max-w-xl text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
            Investissez dans{' '}
            <span className="italic text-beige-700">vos castings</span>
          </h1>
          <p className="mx-auto max-w-md text-base text-neutral-500 sm:text-lg">
            Des plans pensés pour vos castings et shootings à Paris et en proche banlieue — du premier projet à l&apos;agence établie.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-beige-200 bg-white/60 p-1.5 shadow-sm backdrop-blur-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                !isYearly
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isYearly
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Annuel
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200 ${
                  isYearly ? 'bg-beige-500/30 text-beige-100' : 'bg-beige-100 text-beige-700'
                }`}
              >
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Grille des plans */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch lg:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-300 ease-out sm:p-8 ${
                plan.highlighted
                  ? 'border-beige-400/60 bg-beige-50/90 shadow-[0_8px_32px_rgba(176,176,140,0.25)] backdrop-blur-md md:-translate-y-2 md:scale-[1.02] hover:-translate-y-3 hover:shadow-[0_16px_48px_rgba(176,176,140,0.35)]'
                  : 'border-beige-200/60 bg-white/60 shadow-sm backdrop-blur-sm hover:-translate-y-1.5 hover:border-beige-300/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
              }`}
            >
              {/* Badge populaire */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                    <svg className="h-2.5 w-2.5 text-beige-400" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 0l1.12 3.45H9.76L6.82 5.59l1.12 3.45L5 6.9l-2.94 2.14L3.18 5.59.24 3.45h3.64z" />
                    </svg>
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* En-tête du plan */}
              <div className="mb-6">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-beige-600">
                  {plan.tagline}
                </p>
                <h2 className="font-display text-2xl font-bold text-neutral-900">{plan.name}</h2>
              </div>

              {/* Prix */}
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tracking-tight text-neutral-900">
                    {isYearly ? plan.yearlyPrice : plan.monthlyPrice}€
                  </span>
                  <span className="text-sm text-neutral-400">/mois</span>
                </div>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-xs text-beige-600">
                    Facturé {(isYearly ? plan.yearlyPrice : plan.monthlyPrice) * 12}€/an — économisez{' '}
                    {(plan.monthlyPrice - plan.yearlyPrice) * 12}€
                  </p>
                )}
                {plan.monthlyPrice === 0 && (
                  <p className="mt-1 text-xs text-neutral-400">Toujours gratuit</p>
                )}
              </div>

              {/* Séparateur */}
              <div className={`mb-6 h-px ${plan.highlighted ? 'bg-beige-200' : 'bg-beige-100'}`} />

              {/* Features */}
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

              {/* CTA */}
              <Link href="/auth" className="block">
                <Button
                  variant={plan.ctaVariant}
                  size="md"
                  className={`w-full ${
                    plan.highlighted
                      ? ''
                      : 'border-beige-200 hover:border-beige-300 hover:bg-beige-50'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Section de réassurance */}
        <div className="mt-16 text-center sm:mt-20">
          <p className="mb-8 text-sm text-neutral-400">
            Tous les plans incluent un essai de 14 jours · Aucune carte bancaire requise · Annulation à tout moment
          </p>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: '✺', label: 'Mise en ligne en 2 min', sub: 'Publiez votre première annonce immédiatement' },
              { icon: '◎', label: 'Paiement sécurisé', sub: 'Cryptage SSL · Stripe · Données protégées' },
              { icon: '✶', label: 'Support humain', sub: 'Une vraie équipe disponible 7j/7' },
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
