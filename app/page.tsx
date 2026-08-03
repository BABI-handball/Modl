'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/Button';
import { BETA_COPY, IS_BETA } from '@/src/lib/beta';

// ── Scroll-reveal hook ──────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Ticker items ────────────────────────────────────────────────────
const TICKER = [
  'CASTING', 'PARIS', 'MODE', 'MODL', 'SHOOTING', 'ÎLE-DE-FRANCE', 'MANNEQUINAT', 'BEAUTÉ',
  'CASTING', 'PARIS', 'MODE', 'MODL', 'SHOOTING', 'ÎLE-DE-FRANCE', 'MANNEQUINAT', 'BEAUTÉ',
];

/** Captures carrousel section Marques — dimensions = fichiers dans /public */
const MARQUES_SWIPE_CAPTURES: { src: string; width: number; height: number; alt: string }[] = [
  {
    src: '/marques-castings-swipe-01.png',
    width: 1314,
    height: 1424,
    alt: 'Interface MODL — structurer vos castings',
  },
  {
    src: '/marques-castings-swipe-02.png',
    width: 1388,
    height: 1570,
    alt: 'Interface MODL — castings',
  },
];

// ── Pricing ─────────────────────────────────────────────────────────
const plans = [
  {
    name: 'Gratuit',
    tagline: 'Pour commencer',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ['5 annonces par mois', 'Accès aux candidatures', 'Profil de base'],
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
      "Tout ce qui est dans Pro",
      "Gestion d'équipe multi-sièges",
      "Intégrations sur-mesure",
      "Manager de compte dédié",
      "Rapports personnalisés",
    ],
    cta: 'Nous contacter',
    ctaVariant: 'outline' as const,
    highlighted: false,
  },
];

const CheckIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" stroke="currentColor" strokeOpacity="0.2" />
    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false);
  const brandsReveal  = useReveal();
  const modelsReveal  = useReveal();
  const claraReveal   = useReveal();
  const pricingReveal = useReveal();
  const ctaReveal     = useReveal();
  const heroVideoRef  = useRef<HTMLVideoElement>(null);

  // Hero : lecture vidéo (autoplay parfois bloqué sans play() explicite)
  useEffect(() => {
    const v = heroVideoRef.current;
    if (!v) return;
    const play = () => {
      void v.play().catch(() => {});
    };
    v.addEventListener('loadeddata', play);
    v.addEventListener('canplay', play);
    play();
    return () => {
      v.removeEventListener('loadeddata', play);
      v.removeEventListener('canplay', play);
    };
  }, []);

  // Bloque le scroll du document (globals utilise overflow-y: auto !important sur html/body)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.setProperty('overflow', 'hidden', 'important');
    body.style.setProperty('overflow', 'hidden', 'important');
    return () => {
      html.style.removeProperty('overflow');
      body.style.removeProperty('overflow');
    };
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="home-scroll-root relative z-[1]">
      {/* ══════════════════════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative flex h-[100dvh] min-h-[100dvh] shrink-0 snap-start flex-col overflow-x-clip overflow-y-hidden">
        {/* Pas de poster : évite d’afficher une image fixe si la vidéo met du temps à charger */}
        <div className="absolute inset-0 z-0 bg-[#1a1916]" aria-hidden />
        <video
          ref={heroVideoRef}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden={true}
        >
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/25 via-black/15 to-black/35" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_120%_85%_at_50%_0%,rgba(255,253,245,0.08),transparent_52%)] pointer-events-none" />
        {/* Voile sombre sous le texte pour garantir le contraste sur la vidéo */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[11] h-[min(78%,600px)] bg-gradient-to-t from-[rgba(18,16,14,0.88)] via-[rgba(18,16,14,0.55)] to-transparent sm:h-[min(72%,640px)]"
          aria-hidden={true}
        />

        <div className="relative z-20 flex min-h-0 flex-1 flex-col justify-end">
          <div className="w-full max-w-6xl px-5 pb-10 pt-8 sm:px-10 sm:pb-14 lg:px-14 lg:pb-16">
            <div className="animate-fade-in text-left">
              {/* Logo — plus grand, ancré comme une une de magazine */}
              <div className="mb-6 sm:mb-8">
                <img
                  src="/logo-modl.png"
                  alt="MODL"
                  className="h-52 w-52 object-contain brightness-0 invert drop-shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:h-[17rem] sm:w-[17rem] md:h-[19rem] md:w-[19rem] lg:h-[22rem] lg:w-[22rem]"
                />
              </div>

              <p className="font-body mb-4 max-w-xl text-[10px] font-semibold uppercase tracking-[0.38em] text-beige-100/90 sm:mb-5 sm:text-[11px] sm:tracking-[0.42em]">
                Casting · Mode · Paris &amp; Île-de-France
              </p>
              {IS_BETA && (
                <p className="font-body mb-4 max-w-xl text-[11px] font-medium text-beige-300 sm:mb-5 sm:text-sm">
                  {BETA_COPY.heroTag}
                </p>
              )}

              <h1 className="font-display max-w-[22rem] text-[1.9rem] font-bold leading-[1.06] tracking-tight text-beige-50 sm:max-w-3xl sm:text-5xl sm:leading-[1.05] md:text-6xl md:leading-[1.02] lg:max-w-4xl lg:text-[3.75rem]">
                Structurez vos castings,
                <br />
                <span className="font-normal italic text-beige-400">trouvez les talents parfaits.</span>
              </h1>

              <p className="font-body mt-5 max-w-md text-pretty text-[0.95rem] leading-relaxed text-beige-100/85 sm:mt-6 sm:max-w-lg sm:text-lg sm:leading-[1.65]">
                Une plateforme pour les marques, créatifs et modèles&nbsp;: annonces, candidatures et messages, le tout au même endroit.
              </p>

              <div className="mt-8 flex flex-col items-start gap-5 sm:mt-10 sm:flex-row sm:items-center sm:gap-8">
                <Link href="/auth" className="inline-flex">
                  <Button size="md" variant="beige" className="px-9 py-3.5 text-sm font-medium shadow-lg shadow-black/30">
                    Commencer
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => scrollTo('tarifs')}
                  className="font-body group inline-flex items-center gap-2 text-sm font-medium text-beige-100 transition-colors hover:text-beige-300"
                >
                  <span className="border-b border-beige-100/35 pb-px transition-[border-color] group-hover:border-beige-300/70">
                    Voir les tarifs
                  </span>
                  <span aria-hidden className="text-beige-400 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-6 right-6 z-20 flex flex-col items-end gap-1 text-beige-200/70 select-none sm:bottom-8 sm:right-10"
          aria-hidden="true"
        >
          <span className="font-body text-[9px] tracking-[0.28em] uppercase sm:text-[10px]">Défiler</span>
          <svg className="h-4 w-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. TICKER / MARQUEE
      ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 overflow-hidden bg-neutral-950 py-3.5">
        <div className="animate-marquee" aria-hidden="true">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="font-body inline-flex items-center gap-5 mx-5 text-[11px] sm:text-xs tracking-[0.28em] uppercase text-beige-300/95 font-semibold"
            >
              {item}
              <span className="text-beige-600/90 text-[8px]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. SECTION MARQUES — pleine page sombre, typo éditoriale
      ══════════════════════════════════════════════════════════ */}
      <section
        id="valeur"
        ref={brandsReveal.ref as React.RefObject<HTMLElement>}
        className={`reveal relative overflow-hidden ${brandsReveal.visible ? 'visible' : ''}`}
      >
        {/* Barre haut */}
        <div className="flex items-center justify-between border-b border-white/8 bg-neutral-950 px-7 py-3 sm:px-12">
          <span className="select-none font-body text-[9px] uppercase tracking-[0.35em] text-neutral-500">MODL · PLATEFORME DE CASTING MODE</span>
          <span className="select-none font-body text-[9px] uppercase tracking-[0.35em] text-neutral-500">N 01 · Castings</span>
        </div>

        {/* Pleine page sombre — typographie pure */}
        <div className="relative overflow-hidden bg-[#12110f] px-8 py-16 sm:px-14 sm:py-24">
          {/* Watermark fantôme */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-6 select-none font-display font-bold leading-none text-white"
            style={{ fontSize: 'clamp(10rem,32vw,28rem)', opacity: 0.03, letterSpacing: '-0.07em' }}
          >01</span>

          <div className="relative z-10 mx-auto max-w-6xl">
            <p className="mb-10 font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-beige-600">
              Pour les marques &amp; créatifs
            </p>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1px_1fr] lg:gap-0">
              {/* Gauche : grand titre blanc */}
              <div className="lg:pr-16">
                <h2
                  className="font-display font-bold leading-[0.95] text-white"
                  style={{ fontSize: 'clamp(2.15rem, 4.8vw, 4.25rem)', letterSpacing: '-0.035em', lineHeight: 0.95 }}
                >
                  Structurez<br />
                  <span className="italic text-beige-400">vos castings</span>
                  <br />
                  d&apos;un swipe.
                </h2>
                <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-neutral-400 sm:text-base">
                  Indépendants, e-commerce ou grandes maisons, publiez, recevez et pilotez tout depuis un même espace.
                </p>
              </div>

              {/* Filet vertical */}
              <div className="hidden w-px self-stretch bg-white/8 lg:block" />

              {/* Droite : liste numérotée éditoriale */}
              <div className="flex flex-col justify-between lg:pl-16">
                <ol className="divide-y divide-white/8">
                  {[
                    ['Casting publié', 'en moins de 2 minutes'],
                    ['Profils vérifiés', 'et sérieux'],
                    ['Candidatures', 'centralisées'],
                    ['Shootings', 'planifiés facilement'],
                  ].map(([title, sub], i) => (
                    <li key={title} className="flex items-start gap-5 py-5 first:pt-0 last:pb-0">
                      <span
                        className="shrink-0 font-display font-bold leading-none text-beige-700/45"
                        style={{ fontSize: 'clamp(1.5rem,2.8vw,2rem)' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="pt-0.5">
                        <p className="font-body text-sm font-semibold text-white/90">{title}</p>
                        <p className="font-body text-xs text-neutral-500">{sub}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-8 border-t border-white/8 pt-8">
                  <Link href="/auth">
                    <Button variant="beige" size="md">Publier un casting</Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Captures interface — duo incliné, chevauché (style magazine) */}
            <div className="mt-12 border-t border-white/8 pt-10 sm:mt-14 sm:pt-12">
              <p className="mb-10 text-center font-body text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500 sm:mb-12">
                L&apos;interface en un coup d&apos;œil
              </p>
              <div
                className="relative mx-auto flex max-w-4xl flex-row items-center justify-center overflow-visible px-4 pb-6 pt-2 sm:max-w-5xl sm:px-8 sm:pb-10"
                role="region"
                aria-label="Aperçus de l'interface MODL"
              >
                {MARQUES_SWIPE_CAPTURES.map((cap, i) => (
                  <div
                    key={cap.src}
                    className={`relative w-[min(46vw,260px)] shrink-0 sm:w-[min(38vw,300px)] lg:w-[min(34vw,340px)] ${
                      i === 0
                        ? 'z-10 rotate-[-6deg] shadow-[0_24px_60px_rgba(0,0,0,0.55)]'
                        : '-ml-7 z-20 rotate-[7deg] shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:-ml-16 lg:-ml-20'
                    } transition-transform duration-500 ease-out hover:z-[25] hover:-translate-y-1`}
                  >
                    <Image
                      src={cap.src}
                      alt={cap.alt}
                      width={cap.width}
                      height={cap.height}
                      className="h-auto w-full rounded-2xl border border-white/12 ring-1 ring-white/10"
                      sizes="(max-width: 640px) 46vw, 340px"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          4. SECTION MODÈLES — split asymétrique, portrait unique
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={modelsReveal.ref as React.RefObject<HTMLElement>}
        className={`reveal relative overflow-hidden ${modelsReveal.visible ? 'visible' : ''}`}
      >
        {/* Barre haut */}
        <div className="flex items-center justify-between border-b border-white/8 bg-neutral-950 px-7 py-3 sm:px-12">
          <span className="select-none font-body text-[9px] uppercase tracking-[0.35em] text-neutral-500">MODL · PLATEFORME DE CASTING MODE</span>
          <span className="select-none font-body text-[9px] uppercase tracking-[0.35em] text-neutral-500">N 02 · Profils</span>
        </div>

        {/* Split 60/40 — texte dominant */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr]">

          {/* Texte (60 %) fond crème */}
          <div className="flex flex-col justify-between bg-[#f5f0e8] px-8 py-14 sm:px-12 sm:py-20 lg:min-h-[640px]">
            <div>
              <p className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-beige-600">
                Pour les modèles
              </p>
              <h2
                className="font-display font-bold leading-none text-neutral-900"
                style={{ fontSize: 'clamp(3rem,7.5vw,6.5rem)', letterSpacing: '-0.04em', lineHeight: 0.88 }}
              >
                Lance-toi<br />
                <span className="italic text-beige-700">sans attendre</span>.
              </h2>
            </div>

            {/* Pull quote */}
            <blockquote className="my-10 border-l-[2px] border-beige-400 pl-6">
              <p className="font-display text-xl font-bold italic leading-snug text-neutral-800 sm:text-2xl">
                &ldquo;Des castings sérieux, sans intermédiaire. Crée ton profil, postule en un clic et fais grandir ton book.&rdquo;
              </p>
            </blockquote>

            <div className="border-t border-neutral-900/10 pt-8">
              <div className="mb-8 flex flex-wrap gap-x-8 gap-y-3">
                {[
                  'Profil en quelques minutes',
                  'Castings de marques sérieuses',
                  'Postuler en un clic',
                  'Book qui grandit',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-beige-500" />
                    <span className="font-body text-sm text-neutral-600">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/auth">
                <Button variant="beige" size="md">Créer mon profil</Button>
              </Link>
            </div>
          </div>

          {/* Photo (40 %) — duo chevauché / incliné (comme captures Marques) */}
          <div
            className="relative flex min-h-[72vw] flex-col overflow-hidden bg-[#12110f] lg:min-h-[640px]"
            aria-hidden="true"
          >
            <span
              className="pointer-events-none absolute -bottom-4 -left-4 select-none font-display font-bold leading-none text-white"
              style={{ fontSize: 'clamp(6rem,18vw,14rem)', opacity: 0.03, letterSpacing: '-0.06em' }}
            >02</span>

            <div className="relative z-0 flex flex-1 flex-col items-center justify-center px-3 py-10 sm:px-5 sm:py-12 lg:py-14">
              <div className="relative mx-auto flex max-w-4xl flex-row items-center justify-center overflow-visible px-1 pb-2">
                {/* Grande — arrière du duo */}
                <div
                  className={`relative z-10 w-[min(46vw,260px)] shrink-0 rotate-[-6deg] shadow-[0_24px_60px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-out sm:w-[min(40vw,320px)] lg:w-[340px] hover:z-[25] hover:-translate-y-1`}
                >
                  <Image
                    src="/modele-grande-photo.png"
                    alt=""
                    width={2940}
                    height={1654}
                    className="h-auto w-full rounded-2xl border border-white/12 object-contain ring-1 ring-white/10"
                    sizes="(max-width: 1024px) 46vw, 340px"
                  />
                </div>
                {/* Petite — avant, agrandie, chevauchée */}
                <div
                  className={`relative z-20 -ml-7 w-[min(46vw,260px)] shrink-0 rotate-[7deg] shadow-[0_28px_70px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out sm:-ml-16 sm:w-[min(40vw,300px)] lg:-ml-20 lg:w-[min(38vw,320px)] hover:z-[25] hover:-translate-y-1`}
                >
                  <Image
                    src="/modeles-petite-photo.png"
                    alt=""
                    width={2026}
                    height={1412}
                    className="h-auto w-full rounded-2xl border border-white/12 object-contain ring-1 ring-white/10"
                    sizes="(max-width: 1024px) 46vw, 320px"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          5. SECTION AMBASSADRICE — CLARA
      ══════════════════════════════════════════════════════════ */}
      <section
        id="ambassadrice"
        ref={claraReveal.ref as React.RefObject<HTMLElement>}
        className={`reveal relative overflow-hidden ${claraReveal.visible ? 'visible' : ''}`}
      >
        {/* ── Barre magazine haut ── */}
        <div className="flex items-center justify-between bg-neutral-950 px-7 py-3 sm:px-12">
          <span className="font-body text-[9px] tracking-[0.35em] uppercase text-neutral-500 select-none">RACLA - Paris</span>
          <span className="font-body text-[9px] tracking-[0.35em] uppercase text-neutral-500 select-none">№ 03 · Ambassadrice</span>
        </div>

        {/* ── Double page (dark | light) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* PAGE GAUCHE : cluster photo éditorial */}
          <div className="relative flex min-h-[70vw] items-center justify-center overflow-hidden bg-[#12110f] py-20 px-8 sm:px-16 lg:min-h-[680px]">

            {/* Watermark ghost */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display font-bold text-white leading-none"
              style={{ fontSize: 'clamp(6rem,22vw,18rem)', opacity: 0.03, letterSpacing: '-0.06em' }}
            >
              CLARA
            </span>

            {/* Numéro décoratif */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-8 right-8 select-none font-display font-bold text-white/10 leading-none"
              style={{ fontSize: 'clamp(4rem,10vw,8rem)' }}
            >03</span>

            {/* Cluster de photos superposées — même composition, agrandi encore ~10 % */}
            <div className="relative h-[399px] w-[347px] sm:h-[506px] sm:w-[426px]" aria-hidden="true">

              {/* Photo A — grande, arrière-plan */}
              <div
                className="absolute top-0 left-2 z-[10] h-[266px] w-[194px] cursor-pointer overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] outline outline-1 outline-white/[0.06] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:z-[50] hover:shadow-[0_32px_85px_rgba(0,0,0,0.82)] hover:[transform:rotate(-4deg)_translateY(-6px)] sm:left-3 sm:h-[340px] sm:w-[240px] sm:hover:[transform:rotate(-4deg)_translateY(-8px)] [transform:rotate(-4deg)]"
              >
                <Image
                  src="/clara-grande-derriere.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="240px"
                />
              </div>

              {/* Photo B — grande, premier plan (chevauche A) */}
              <div
                className="absolute top-8 left-[128px] z-[20] h-[246px] w-[180px] cursor-pointer overflow-hidden rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] outline outline-1 outline-white/[0.05] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:z-[50] hover:shadow-[0_36px_90px_rgba(0,0,0,0.85)] hover:[transform:rotate(5deg)_translateY(-6px)] sm:left-[154px] sm:h-[314px] sm:w-[227px] sm:hover:[transform:rotate(5deg)_translateY(-8px)] [transform:rotate(5deg)]"
              >
                <Image
                  src="/clara-grande-devant.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="240px"
                />
              </div>

              {/* Photo C — petit accent bas gauche */}
              <div
                className="absolute bottom-0 left-0 z-[30] h-[173px] w-[146px] cursor-pointer overflow-hidden rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] outline outline-1 outline-white/[0.08] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:z-[50] hover:shadow-[0_28px_75px_rgba(0,0,0,0.78)] hover:[transform:rotate(-7deg)_translateY(-6px)] sm:h-[213px] sm:w-[186px] sm:hover:[transform:rotate(-7deg)_translateY(-8px)] [transform:rotate(-7deg)]"
              >
                <Image
                  src="/clara-petite.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="200px"
                />
              </div>

              {/* Trait décoratif */}
              <div
                className="absolute -top-6 right-4 sm:right-6 h-16 w-px bg-gradient-to-b from-transparent via-beige-500/50 to-transparent"
                style={{ zIndex: 5 }}
              />
            </div>

            {/* Trait latéral droit (séparation de page) */}
            <div className="absolute right-0 top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-white/5 to-transparent lg:block" />
          </div>

          {/* PAGE DROITE : contenu éditorial */}
          <div className="flex flex-col justify-between bg-[#f5f0e8] px-8 sm:px-12 py-12 sm:py-16 lg:min-h-[680px]">

            {/* Bloc titre */}
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.35em] text-beige-600 mb-2">
                Ambassadrice · Co-fondatrice
              </p>
              <h2
                className="font-display font-bold text-neutral-900 leading-none"
                style={{ fontSize: 'clamp(4.5rem,10vw,9rem)', letterSpacing: '-0.045em', lineHeight: 0.88 }}
              >
                Clara
              </h2>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-900/12" />
                <span className="font-body text-[9px] tracking-[0.35em] uppercase text-neutral-400 whitespace-nowrap">
                  Expertise terrain · Paris
                </span>
              </div>
            </div>

            {/* Citation + bio */}
            <div className="my-8 sm:my-10">
              <blockquote className="mb-6 border-l-[2px] border-neutral-900/20 pl-5">
                <p className="font-display text-lg sm:text-xl md:text-2xl font-bold italic leading-snug text-neutral-800">
                  &ldquo;MODL est née d'un besoin réel du terrain : simplifier les échanges entre modèles, photographes et marques avec un outil pensé par celles et ceux qui vivent ces castings au quotidien.&rdquo;
                </p>
              </blockquote>
              <p className="font-body text-sm sm:text-base leading-relaxed text-neutral-600">
                Clara a co-développé MODL dès les premières étapes du projet. Son expertise du milieu a guidé les choix produit pour répondre à des besoins concrets : candidatures plus lisibles pour les modèles, sélection plus fluide pour les marques et échanges plus clairs avec les photographes.
              </p>
            </div>

            {/* Stats style magazine */}
            <div>
              <div className="grid grid-cols-3 border-y border-neutral-900/10 py-6 mb-8">
                {[
                  { num: '50+', label: 'Retours terrain' },
                  { num: '3', label: 'Profils métiers' },
                  { num: '100%', label: 'Pensé usage réel' },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className={`text-center ${i > 0 ? 'border-l border-neutral-900/10' : ''}`}
                  >
                    <p className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 leading-none">
                      {s.num}
                    </p>
                    <p className="font-body mt-1.5 text-[9px] tracking-[0.25em] uppercase text-neutral-500">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link href="/auth">
                <Button variant="beige" size="md" className="w-full sm:w-auto">
                  Rejoindre la communauté
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Barre magazine bas ── */}
        <div className="flex items-center justify-between bg-neutral-950 px-7 py-3 sm:px-12">
          <span className="font-body text-[9px] tracking-[0.3em] uppercase text-neutral-600 select-none">MODL · Plateforme de casting mode</span>
          <span className="font-body text-[9px] tracking-[0.3em] uppercase text-neutral-600 select-none">Paris, Île-de-France</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. SECTION TARIFS
      ══════════════════════════════════════════════════════════ */}
      <section
        id="tarifs"
        ref={pricingReveal.ref as React.RefObject<HTMLElement>}
        className={`reveal scroll-mt-6 flex snap-start flex-col justify-center px-6 py-10 sm:px-12 sm:py-14 bg-[radial-gradient(ellipse_110%_70%_at_50%_-15%,rgba(245,240,232,0.09),transparent_52%),radial-gradient(ellipse_85%_55%_at_95%_85%,rgba(212,196,168,0.07),transparent_48%),radial-gradient(ellipse_70%_50%_at_5%_60%,rgba(176,160,120,0.05),transparent_45%),linear-gradient(180deg,#0a0a0a_0%,#14110f_42%,#12100d_58%,#080808_100%)] ${pricingReveal.visible ? 'visible' : ''}`}
      >
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-beige-500 mb-4">
              {IS_BETA ? 'Beta · Accès gratuit' : 'Tarifs · Paris / Île-de-France'}
            </p>
            <h2 className="font-display text-[2.35rem] sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05] mb-5 text-balance">
              {IS_BETA ? (
                <>
                  Beta gratuite —<br />
                  <span className="italic text-beige-400">tout est offert</span>
                </>
              ) : (
                <>
                  Investissez dans<br />
                  <span className="italic text-beige-400">vos castings</span>
                </>
              )}
            </h2>
            <p className="font-body text-base text-neutral-400 max-w-lg mx-auto leading-relaxed">
              {IS_BETA
                ? BETA_COPY.pricingSub
                : 'Commencez gratuitement, évoluez quand vous êtes prêt·e, annulation à tout moment.'}
            </p>

            {IS_BETA && (
              <div className="mt-8 mx-auto max-w-md rounded-2xl border border-beige-500/30 bg-beige-50/95 px-6 py-5 text-left">
                <p className="font-display text-2xl font-bold text-neutral-900 mb-2">0€ pendant la beta</p>
                <ul className="space-y-1.5 text-sm text-neutral-700">
                  <li>· Annonces illimitées</li>
                  <li>· Crédits illimités pour débloquer</li>
                  <li>· Accès complet à la plateforme</li>
                </ul>
                <Link href="/auth" className="mt-4 inline-flex">
                  <Button variant="beige" size="md" className="px-6">
                    Rejoindre la beta
                  </Button>
                </Link>
              </div>
            )}

            {!IS_BETA && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-800/60 p-1.5">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={`rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 font-body ${
                  !isYearly ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium transition-all duration-200 font-body ${
                  isYearly ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Annuel
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-200 ${
                  isYearly ? 'bg-beige-700/30 text-beige-300' : 'bg-neutral-700 text-beige-400'
                }`}>
                  −20%
                </span>
              </button>
            </div>
            )}
          </div>

          {IS_BETA && (
            <p className="font-body mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Aperçu des tarifs à venir
            </p>
          )}

          {/* Cards — pt pour laisser dépasser le badge « Populaire » (overflow-visible sur la carte) */}
          <div className="grid grid-cols-1 gap-5 pt-4 md:grid-cols-3 md:items-stretch md:pt-5 lg:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`group relative flex flex-col overflow-visible rounded-3xl border p-7 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
                  plan.highlighted
                    ? 'border-beige-500/40 bg-beige-50/95 shadow-[0_8px_40px_rgba(176,176,140,0.2)] md:-translate-y-2 md:scale-[1.02] hover:-translate-y-3 hover:scale-[1.03] hover:border-beige-400/80 hover:shadow-[0_24px_56px_rgba(180,160,110,0.35)]'
                    : 'border-neutral-700/50 bg-neutral-800/60 backdrop-blur-sm hover:-translate-y-2 hover:border-beige-500/35 hover:bg-neutral-800/90 hover:shadow-[0_20px_50px_rgba(0,0,0,0.42)]'
                } ${IS_BETA ? 'opacity-90' : ''}`}
              >
                {/* Reflet / profondeur au survol */}
                <div
                  className={`pointer-events-none absolute inset-0 z-0 rounded-3xl opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 ${
                    plan.highlighted
                      ? 'bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(255,255,255,0.55),transparent_50%),linear-gradient(165deg,rgba(255,253,245,0.4)_0%,transparent_45%,rgba(200,180,120,0.08)_100%)]'
                      : 'bg-[radial-gradient(100%_60%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%),linear-gradient(165deg,rgba(255,255,255,0.06)_0%,transparent_40%,rgba(180,160,100,0.07)_100%)]'
                  }`}
                  aria-hidden
                />
                <div
                  className={`pointer-events-none absolute -inset-px z-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                    plan.highlighted
                      ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
                      : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                  }`}
                  aria-hidden
                />

                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 sm:-top-5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-beige-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-md ring-2 ring-beige-50/90 font-body">
                      {IS_BETA ? 'À venir' : plan.badge}
                    </span>
                  </div>
                )}

                <div className="relative z-10 flex flex-1 flex-col">
                  <div className="mb-5">
                    <p className={`font-body mb-0.5 text-xs font-semibold uppercase tracking-widest ${plan.highlighted ? 'text-beige-600' : 'text-neutral-400'}`}>
                      {plan.tagline}
                    </p>
                    <h3 className={`font-display text-2xl font-bold ${plan.highlighted ? 'text-neutral-900' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                  </div>

                  <div className="mb-7">
                    <div className="flex items-baseline gap-1">
                      <span className={`font-display text-5xl font-bold tracking-tight ${plan.highlighted ? 'text-neutral-900' : 'text-white'}`}>
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}€
                      </span>
                      <span className={`font-body text-sm ${plan.highlighted ? 'text-neutral-400' : 'text-neutral-500'}`}>/mois</span>
                    </div>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <p className="font-body mt-1 text-xs text-beige-600">
                        Économisez {(plan.monthlyPrice - plan.yearlyPrice) * 12}€/an
                      </p>
                    )}
                    {plan.monthlyPrice === 0 && (
                      <p className={`font-body mt-1 text-xs ${plan.highlighted ? 'text-neutral-400' : 'text-neutral-500'}`}>Toujours gratuit</p>
                    )}
                    {IS_BETA && plan.monthlyPrice > 0 && (
                      <p className={`font-body mt-1 text-xs ${plan.highlighted ? 'text-beige-700' : 'text-beige-400'}`}>
                        Non facturé pendant la beta
                      </p>
                    )}
                  </div>

                  <div className={`mb-6 h-px ${plan.highlighted ? 'bg-beige-200' : 'bg-neutral-700'}`} />

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`font-body flex items-center gap-3 text-sm ${plan.highlighted ? 'text-neutral-700' : 'text-neutral-300'}`}>
                        <span className={plan.highlighted ? 'text-beige-600' : 'text-neutral-500'}><CheckIcon /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth" className="mt-auto block">
                    <Button
                      variant={plan.ctaVariant}
                      size="md"
                      className={`w-full transition-transform duration-300 group-hover:scale-[1.02] ${!plan.highlighted ? 'border-neutral-600 text-neutral-200 hover:bg-neutral-700/50' : ''}`}
                    >
                      {IS_BETA ? 'Rejoindre la beta' : plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="font-body mt-10 text-center text-xs text-neutral-500">
            {IS_BETA
              ? BETA_COPY.footer
              : 'Paiement en ligne sécurisé · Sans engagement · Annulation à tout moment'}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. CTA FINAL
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={ctaReveal.ref as React.RefObject<HTMLElement>}
        className={`reveal relative overflow-hidden ${ctaReveal.visible ? 'visible' : ''}`}
      >
        {/* Barre magazine haut */}
        <div className="flex items-center justify-between bg-neutral-950 px-7 py-3 sm:px-12">
          <span className="select-none font-body text-[9px] uppercase tracking-[0.35em] text-neutral-500">Rejoindre MODL</span>
          <span className="select-none font-body text-[9px] uppercase tracking-[0.35em] text-neutral-500">Inscription</span>
        </div>

        {/* Contenu crème pleine largeur */}
        <div className="relative overflow-hidden bg-[#f5f0e8] px-6 py-8 text-center sm:px-12 sm:py-10">
          {/* Image de fond — un peu plus visible sous le voile */}
          <div
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{ backgroundImage: 'url(/home-background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 30%' }}
          />
          <div className="absolute inset-0 bg-[#f5f0e8]/58" />

          <div className="relative z-10 mx-auto max-w-xl">
            {/* Ornement */}
            <div className="mb-5 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-neutral-900/15" />
              <span className="font-body text-[9px] uppercase tracking-[0.4em] text-beige-600">
                {IS_BETA ? 'Beta gratuite' : 'Compte gratuit'}
              </span>
              <div className="h-px w-12 bg-neutral-900/15" />
            </div>

            <h2
              className="font-display font-bold text-balance text-neutral-900"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: '-0.03em', lineHeight: 1.08 }}
            >
              Prêt·e à faire<br />
              <span className="italic text-beige-700">décoller</span><br />
              votre carrière&nbsp;?
            </h2>

            <div className="mt-5 flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-neutral-900/15" />
              <span className="font-body text-[9px] uppercase tracking-[0.35em] text-neutral-400">Paris · Île-de-France</span>
              <div className="h-px w-16 bg-neutral-900/15" />
            </div>

            <p className="font-body mx-auto mt-5 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-base">
              {IS_BETA
                ? 'MODL est en beta : tout est 100 % gratuit. Publiez, postulez et échangez — vos retours nous aident.'
                : 'Une seule plateforme pour publier, postuler et échanger, tout commence avec un compte gratuit.'}
            </p>

            <div className="mt-6">
              <Link href="/auth">
                <Button variant="beige" size="md" className="px-10 py-3.5 shadow-lg shadow-beige-900/15">
                  {IS_BETA ? 'Rejoindre la beta gratuitement' : 'Créer mon compte gratuitement'}
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER LÉGAL
      ══════════════════════════════════════════════════════════ */}
      <footer className="snap-start bg-neutral-950 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row sm:gap-3">
          <Link href="/" className="shrink-0 leading-none opacity-70 transition-opacity hover:opacity-100">
            <img src="/logo-modl.png" alt="MODL" className="h-32 w-32 object-contain invert sm:h-36 sm:w-36" />
          </Link>
          <nav
            className="flex max-w-full flex-wrap justify-center gap-x-3 gap-y-1 sm:justify-end sm:gap-x-4 sm:gap-y-0"
            aria-label="Liens légal"
          >
            {[
              { href: '/legal/mentions-legales', label: 'Mentions légales' },
              { href: '/legal/conditions-generales', label: 'Conditions générales' },
              { href: '/legal/politique-de-confidentialite', label: 'Confidentialité' },
              { href: '/faq', label: 'FAQ & contact' },
              { href: '/pricing', label: IS_BETA ? 'Beta gratuite' : 'Tarifs' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-[11px] leading-tight text-neutral-400 transition-colors hover:text-white hover:underline hover:underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-beige-500 sm:text-xs"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

    </div>
  );
}
