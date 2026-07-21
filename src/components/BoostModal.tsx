'use client';

import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { JobPost } from '@/src/types';
import { jobsStore } from '@/src/lib/jobs';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPost;
  onBoostSuccess?: () => void;
}

interface BoostOption {
  days: number;
  label: string;
  price: number;
}

const boostOptions: BoostOption[] = [
  { days: 3, label: '3 jours', price: 15 },
  { days: 7, label: '7 jours', price: 30 },
  { days: 14, label: '14 jours', price: 50 },
  { days: 30, label: '30 jours', price: 80 },
];

export const BoostModal = ({ isOpen, onClose, job, onBoostSuccess }: BoostModalProps) => {
  const [selectedOption, setSelectedOption] = useState<BoostOption>(boostOptions[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBoost = async () => {
    setIsProcessing(true);

    // Simuler un paiement (dans une vraie app, intégration Stripe/PayPal)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Calculer la date de fin du boost
    const boostUntil = new Date();
    boostUntil.setDate(boostUntil.getDate() + selectedOption.days);

    // Mettre à jour l'annonce
    jobsStore.update(job.id, {
      isBoosted: true,
      boostUntil: boostUntil,
    });

    setIsProcessing(false);
    onBoostSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booster votre annonce">
      <div className="space-y-5">
        {/* Info de l'annonce */}
        <div className="p-3 bg-beige-50 rounded-lg border border-beige-200">
          <h3 className="text-base font-bold text-neutral-900 mb-1">{job.title}</h3>
          <p className="text-xs text-neutral-600">
            Boostez votre annonce pour apparaître en haut de la liste et obtenir plus de candidatures.
          </p>
        </div>

        {/* Options de boost */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-neutral-700">
            Choisissez la durée du boost
          </label>
          <div className="grid grid-cols-2 gap-2">
            {boostOptions.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setSelectedOption(option)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedOption.days === option.days
                    ? 'border-beige-500 bg-beige-50 shadow-md'
                    : 'border-beige-200 hover:border-beige-300 bg-white'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl font-bold text-neutral-900 mb-0.5">
                    {option.label}
                  </div>
                  <div className="text-lg font-bold text-beige-600">
                    {option.price}€
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Avantages du boost */}
        <div className="p-3 bg-gradient-to-br from-beige-100 to-beige-50 rounded-lg border border-beige-300">
          <h4 className="text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
            <svg className="h-4 w-4 text-beige-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Avantages du boost
          </h4>
          <ul className="space-y-1.5 text-xs text-neutral-700">
            <li className="flex items-start gap-1.5">
              <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Apparaît en premier dans les résultats</span>
            </li>
            <li className="flex items-start gap-1.5">
              <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Badge "Sponsorisé" pour plus de visibilité</span>
            </li>
            <li className="flex items-start gap-1.5">
              <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Jusqu'à 3x plus de candidatures</span>
            </li>
          </ul>
        </div>

        {/* Résumé et paiement */}
        <div className="p-4 bg-neutral-900 text-white rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs opacity-90">Durée du boost</span>
            <span className="text-base font-bold">{selectedOption.label}</span>
          </div>
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-white/20">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-2xl font-bold">{selectedOption.price}€</span>
          </div>
          <Button
            onClick={handleBoost}
            disabled={isProcessing}
            className="w-full bg-beige-500 hover:bg-beige-600 text-white font-bold py-3 text-base"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Traitement en cours...
              </span>
            ) : (
              `Booster pour ${selectedOption.price}€`
            )}
          </Button>
        </div>

        {/* Note légale */}
        <p className="text-xs text-neutral-500 text-center -mt-2">
          Le paiement est sécurisé. Vous pouvez annuler le boost à tout moment.
        </p>
      </div>
    </Modal>
  );
};
