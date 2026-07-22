'use client';

import { BETA_COPY, IS_BETA } from '@/src/lib/beta';

interface UnlockModalProps {
  isOpen: boolean;
  credits: number;
  jobTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UnlockModal = ({ isOpen, credits, jobTitle, onConfirm, onCancel }: UnlockModalProps) => {
  if (!isOpen) return null;

  const hasCredits = IS_BETA || credits > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-sm rounded-3xl border border-beige-200 bg-white/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)] backdrop-blur-md animate-scale-in">
        <div className="mb-4 flex justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${hasCredits ? 'bg-beige-100' : 'bg-neutral-100'}`}>
            {hasCredits ? (
              <svg className="h-7 w-7 text-beige-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : (
              <svg className="h-7 w-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>
        </div>

        {hasCredits ? (
          <>
            <h2 className="mb-1 text-center font-display text-xl font-bold text-neutral-900">
              Débloquer cette annonce
            </h2>
            <p className="mb-1 text-center text-sm text-neutral-500 line-clamp-2">
              {jobTitle}
            </p>

            <div className="my-4 flex flex-col items-center justify-center gap-1 rounded-2xl border border-beige-100 bg-beige-50 py-3 px-3">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-beige-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
                <span className="text-sm font-semibold text-neutral-700">
                  {IS_BETA
                    ? BETA_COPY.creditsLabel
                    : `${credits} crédit${credits > 1 ? 's' : ''} restant${credits > 1 ? 's' : ''}`}
                </span>
              </div>
              {!IS_BETA && (
                <span className="text-xs text-neutral-400">— 1 sera utilisé</span>
              )}
              {IS_BETA && (
                <span className="text-center text-[11px] text-neutral-500">
                  Le déblocage reste : plus tard, 1 crédit sera consommé.
                </span>
              )}
            </div>

            <p className="mb-5 text-center text-xs text-neutral-400">
              {IS_BETA
                ? 'Pendant la beta, les crédits sont illimités et gratuits.'
                : 'Vos crédits sont rechargés automatiquement chaque mois.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 rounded-2xl border border-beige-200 bg-transparent px-4 py-3 text-sm font-medium text-neutral-600 transition-all duration-200 hover:bg-beige-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-700 active:scale-[0.98]"
              >
                {IS_BETA ? 'Débloquer' : 'Utiliser 1 crédit'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-center font-display text-xl font-bold text-neutral-900">
              Plus de crédits
            </h2>
            <p className="mb-4 text-center text-sm text-neutral-500">
              Vous avez utilisé tous vos crédits ce mois-ci. Ils se rechargent automatiquement chaque mois.
            </p>

            <div className="mb-5 rounded-2xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Recharge dans</p>
              <p className="text-2xl font-bold text-neutral-800 font-display">30 jours</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={onCancel}
                className="w-full rounded-2xl border border-beige-200 bg-transparent px-4 py-3 text-sm font-medium text-neutral-600 transition-all duration-200 hover:bg-beige-50"
              >
                Fermer
              </button>
              <a
                href="/pricing"
                className="block w-full rounded-2xl bg-neutral-900 px-4 py-3 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-neutral-700"
              >
                Voir les tarifs
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
