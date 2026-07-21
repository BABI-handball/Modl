'use client';

import Link from "next/link";
import { useState } from "react";

const faqs = [
  {
    id: "01",
    q: "Où se déroulent les castings sur MODL ?",
    a: "MODL est actuellement dédiée à Paris et à l'Île-de-France. Toutes les annonces sont limitées à Paris, ses arrondissements et les principales villes de la région parisienne.",
  },
  {
    id: "02",
    q: "Est-ce payant pour les modèles / talents ?",
    a: "Non, la création de profil et la candidature aux annonces sont gratuites pour les modèles et les autres talents pendant la phase de lancement.",
  },
  {
    id: "03",
    q: "Qui paie les modèles et les créatifs ?",
    a: "Les paiements sont gérés directement entre la marque / le créatif qui publie l'annonce et les talents sélectionnés. MODL ne prend pas part aux paiements.",
  },
  {
    id: "04",
    q: "Qui est responsable des contrats et des droits à l'image ?",
    a: "Les contrats, conditions de travail et droits à l'image sont conclus directement entre les marques / créatifs et les talents. MODL fournit uniquement un outil de mise en relation.",
  },
  {
    id: "05",
    q: "Puis-je publier une annonce en dehors de l'Île-de-France ?",
    a: "Non, pour le moment les lieux d'annonce sont limités à Paris et à l'Île-de-France. Cette contrainte permet de concentrer l'offre et la demande sur une même zone.",
  },
  {
    id: "06",
    q: "Comment contacter l'équipe MODL en cas de problème ?",
    a: "Vous pouvez nous écrire à l'adresse contact@modl.app. Nous faisons au mieux pour répondre rapidement à chaque message.",
  },
];

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <div className="h-screen overflow-y-auto bg-beige-50/80">
      {/* Header */}
      <div className="border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-5 sm:px-12 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-neutral-500 hover:text-neutral-800 transition-colors duration-200 mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Retour
          </Link>

          <div className="space-y-3 animate-fade-in">
            <p className="text-xs tracking-[0.2em] uppercase text-beige-600 font-medium">
              Aide
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Foire aux questions
            </h1>
            <p className="text-sm text-neutral-400">
              MODL — castings à Paris et en Île-de-France
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-5 sm:px-12 py-10 sm:py-16 pb-32">
        <div className="rounded-3xl border border-beige-200/80 bg-white/85 shadow-[0_18px_45px_rgba(0,0,0,0.06)] backdrop-blur-md px-5 sm:px-10 py-8 sm:py-12 space-y-4 text-[15px] leading-relaxed md:text-[16px]">
          {faqs.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="group grid grid-cols-[auto,1fr] gap-4 sm:gap-6 transition-all duration-300 ease-out animate-fade-in"
              >
                <div className="pt-1">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-beige-100 text-[11px] font-mono font-semibold text-beige-700 transition-colors duration-200 group-hover:bg-beige-200">
                    {item.id}
                  </span>
                </div>
                <div className="space-y-2 border-l-2 border-beige-200 pl-4 sm:pl-6 transition-colors duration-200 group-hover:border-beige-400">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full text-left"
                  >
                    <h2
                      className="text-sm sm:text-base font-semibold text-neutral-900 tracking-tight flex items-center justify-between gap-2"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      <span className="pr-2">{item.q}</span>
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full bg-beige-100 flex items-center justify-center text-beige-700 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </h2>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-[13px] sm:text-[15px] leading-relaxed text-neutral-700 pt-1 pb-2">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-900/8 rounded-2xl border border-beige-200/80 bg-white/70 backdrop-blur-sm px-5 sm:px-8 py-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-beige-600 font-medium mb-2">
            Contact
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Une autre question ? Écrivez-nous à{" "}
            <a
              href="mailto:contact@modl.app"
              className="font-semibold text-beige-700 underline underline-offset-2 hover:text-beige-800 transition-colors duration-200"
            >
              contact@modl.app
            </a>
            . Nous répondons au plus vite.
          </p>
        </div>
      </div>
    </div>
  );
}
