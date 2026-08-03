'use client';

import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { JobPost } from '@/src/types';
import { jobsStore } from '@/src/lib/jobs';
import { IS_BETA } from '@/src/lib/beta';

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
    await new Promise((resolve) => setTimeout(resolve, IS_BETA ? 400 : 1500));

    const boostUntil = new Date();
    boostUntil.setDate(boostUntil.getDate() + selectedOption.days);

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
        <div className="p-3 bg-beige-50 rounded-lg border border-beige-200">
          <h3 className="text-base font-bold text-neutral-900 mb-1">{job.title}</h3>
          <p className="text-xs text-neutral-600">
            Boostez votre annonce pour apparaître en haut de la liste et obtenir plus de candidatures.
          </p>
        </div>

        {IS_BETA && (
          <div className="rounded-lg border border-beige-400/50 bg-beige-100 px-3 py-2.5 text-xs leading-relaxed text-neutral-800">
            <strong className="font-semibold">Beta gratuite :</strong> le boost est offert pour l’instant.
            Il sera payant plus tard (à partir de {boostOptions[0].price}€).
          </div>
        )}

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
                    {IS_BETA ? (
                      <>
                        <span className="mr-1.5 text-sm font-medium text-neutral-400 line-through">
                          {option.price}€
                        </span>
                        Gratuit
                      </>
                    ) : (
                      `${option.price}€`
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-gradient-to-br from-beige-100 to-beige-50 rounded-lg border border-beige-300">
          <h4 className="text-xs font-bold text-neutral-900 mb-2">Avantages du boost</h4>
          <ul className="space-y-1.5 text-xs text-neutral-700">
            <li>Apparaît en premier dans les résultats</li>
            <li>Badge « Sponsorisé » pour plus de visibilité</li>
            <li>Jusqu&apos;à 3x plus de candidatures</li>
          </ul>
        </div>

        <div className="p-4 bg-neutral-900 text-white rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs opacity-90">Durée du boost</span>
            <span className="text-base font-bold">{selectedOption.label}</span>
          </div>
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-white/20">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-2xl font-bold">
              {IS_BETA ? '0€' : `${selectedOption.price}€`}
            </span>
          </div>
          <Button
            onClick={handleBoost}
            disabled={isProcessing}
            className="w-full bg-beige-500 hover:bg-beige-600 text-white font-bold py-3 text-base"
          >
            {isProcessing
              ? 'Activation…'
              : IS_BETA
                ? 'Booster gratuitement (beta)'
                : `Booster pour ${selectedOption.price}€`}
          </Button>
        </div>

        <p className="text-xs text-neutral-500 text-center -mt-2">
          {IS_BETA
            ? 'Pendant la beta, aucun paiement n’est demandé. Les tarifs arriveront plus tard.'
            : 'Le paiement est sécurisé. Vous pouvez annuler le boost à tout moment.'}
        </p>
      </div>
    </Modal>
  );
};
