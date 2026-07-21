import Link from "next/link";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="h-screen overflow-y-auto bg-beige-50/80">
      {/* Header */}
      <div className="border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-5 sm:px-12 py-10 sm:py-14">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-neutral-500 hover:text-neutral-800 transition-colors mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour
          </Link>

          <div className="space-y-3">
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 font-medium">
              Légal
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Politique de confidentialité
            </h1>
            <p className="text-sm text-neutral-400">
              Dernière mise à jour : 12 mars 2026
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-5 sm:px-12 py-10 sm:py-16 pb-32">
        <div className="rounded-3xl border border-beige-200/80 bg-white/85 shadow-[0_18px_45px_rgba(0,0,0,0.06)] backdrop-blur-md px-5 sm:px-10 py-8 sm:py-12 space-y-10 text-[15px] leading-relaxed md:text-[16px]">

          <div className="pl-9 text-base leading-[1.85] text-neutral-600 space-y-3 pb-8 border-b border-neutral-900/6">
            <p>
              La présente politique de confidentialité décrit la manière dont MODL collecte, utilise
              et protège vos données personnelles lorsque vous utilisez la Plateforme.
            </p>
            <p>
              Nous nous engageons à traiter vos données de manière transparente et conforme à la
              réglementation applicable, notamment le Règlement général sur la protection des données
              (&quot;RGPD&quot;).
            </p>
          </div>

          <Section number="01" title="Données que nous collectons">
            <p>Nous pouvons collecter notamment :</p>
            <ul>
              <li>Vos informations d&apos;identification (nom, prénom, email)</li>
              <li>Les informations de profil (rôle, description, localisation)</li>
              <li>Les contenus que vous publiez (annonces, photos, messages)</li>
              <li>Les informations de navigation (logs, device, pages consultées)</li>
            </ul>
          </Section>

          <Section number="02" title="Finalités du traitement">
            <p>Vos données sont traitées principalement pour :</p>
            <ul>
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Mettre en relation Marques et Talents</li>
              <li>Assurer la sécurité et le bon fonctionnement de la Plateforme</li>
              <li>Communiquer avec vous (notifications, support, informations)</li>
              <li>Améliorer nos services et réaliser des statistiques d&apos;usage</li>
            </ul>
          </Section>

          <Section number="03" title="Bases légales">
            <p>Selon les cas, le traitement de vos données repose sur :</p>
            <ul>
              <li>Votre consentement</li>
              <li>L&apos;exécution du contrat liant MODL aux utilisateurs de la Plateforme</li>
              <li>Nos obligations légales</li>
              <li>Notre intérêt légitime à développer et sécuriser le service</li>
            </ul>
          </Section>

          <Section number="04" title="Destinataires des données">
            <p>Vos données peuvent être transmises :</p>
            <ul>
              <li>Aux autres utilisateurs avec lesquels vous interagissez</li>
              <li>À nos prestataires techniques (hébergement, emails, outils d&apos;analyse)</li>
              <li>Aux autorités compétentes, si la loi l&apos;exige ou pour défendre nos droits</li>
            </ul>
          </Section>

          <Section number="05" title="Durée de conservation">
            <p>
              Vos données sont conservées pendant la durée nécessaire aux finalités décrites
              ci-dessus, augmentée des durées de prescription légales applicables. Vous pouvez
              demander la suppression de votre compte à tout moment.
            </p>
          </Section>

          <Section number="06" title="Vos droits">
            <p>Conformément à la réglementation, vous disposez notamment des droits suivants :</p>
            <ul>
              <li>Droit d&apos;accès et de rectification</li>
              <li>Droit d&apos;effacement (&quot;droit à l&apos;oubli&quot;)</li>
              <li>Droit d&apos;opposition et de limitation du traitement</li>
              <li>Droit à la portabilité des données</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>
            <p>
              Pour exercer vos droits, contactez-nous à{" "}
              <a href="mailto:privacy@modl.app" className="font-medium text-neutral-900 underline underline-offset-2 hover:opacity-70 transition-opacity">
                privacy@modl.app
              </a>
              .
            </p>
          </Section>

          <Section number="07" title="Sécurité des données">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour
              protéger vos données contre la perte, l&apos;usage abusif, l&apos;accès non autorisé
              ou la divulgation. Aucun système n&apos;étant parfait, nous ne pouvons toutefois
              garantir une sécurité absolue.
            </p>
          </Section>

          <Section number="08" title="Modifications de la politique">
            <p>
              Nous pouvons mettre à jour la présente politique de confidentialité afin de refléter
              l&apos;évolution de nos pratiques ou de la réglementation. La version en vigueur est
              toujours disponible sur cette page.
            </p>
          </Section>

        </div>

        <LegalNav current="politique-de-confidentialite" />
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="group grid grid-cols-[auto,1fr] gap-4 sm:gap-6">
      <div className="pt-1">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-beige-100 text-[11px] font-mono text-neutral-500">
          {number}
        </span>
      </div>
      <div className="space-y-3 border-l border-neutral-200 pl-4 sm:pl-6">
        <h2 className="text-sm sm:text-base font-semibold text-neutral-900 tracking-tight">
          {title}
        </h2>
        <div className="text-[13px] sm:text-[15px] leading-relaxed text-neutral-700 space-y-2 [&_ul]:space-y-1.5 [&_ul]:mt-2 [&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.6em] [&_li]:before:w-1.5 [&_li]:before:h-px [&_li]:before:bg-neutral-300">
          {children}
        </div>
      </div>
    </div>
  );
}

function LegalNav({ current }: { current: string }) {
  const links = [
    { href: "/legal/mentions-legales", label: "Mentions légales" },
    { href: "/legal/politique-de-confidentialite", label: "Confidentialité" },
    { href: "/legal/conditions-generales", label: "CGU" },
  ];
  return (
    <div className="mt-16 pt-8 border-t border-neutral-900/8">
      <p className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Documents légaux</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm transition-colors ${
              current === link.href.split("/").pop()
                ? "text-neutral-900 font-medium"
                : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
