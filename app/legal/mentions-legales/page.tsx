import Link from "next/link";

export default function MentionsLegalesPage() {
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
              Mentions légales
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

          <Section number="01" title="Éditeur du site">
            <p>
              Le site MODL est édité par :<br />
              <span className="font-semibold text-neutral-900">[Nom de la société / entrepreneur]</span><br />
              [Forme juridique] au capital de [X €]<br />
              Siège social : [Adresse complète]<br />
              Immatriculation : [RCS / SIREN / SIRET]<br />
              Email :{" "}
              <a href="mailto:contact@modl.app" className="font-medium text-neutral-900 underline underline-offset-2 hover:opacity-70 transition-opacity">
                contact@modl.app
              </a>
            </p>
          </Section>

          <Section number="02" title="Hébergeur">
            <p>
              Le site est hébergé par :<br />
              <span className="font-semibold text-neutral-900">[Nom de l&apos;hébergeur]</span><br />
              [Adresse de l&apos;hébergeur]<br />
              Site web : [URL de l&apos;hébergeur]
            </p>
          </Section>

          <Section number="03" title="Propriété intellectuelle">
            <p>
              L&apos;ensemble du contenu du site (textes, visuels, logo, charte graphique, etc.),
              hors contenus publiés par les utilisateurs, est la propriété exclusive de l&apos;éditeur
              ou fait l&apos;objet d&apos;une autorisation d&apos;utilisation. Toute reproduction,
              représentation, modification ou diffusion non autorisée est interdite.
            </p>
          </Section>

          <Section number="04" title="Données personnelles">
            <p>
              Pour plus d&apos;informations sur la collecte et le traitement de vos données personnelles,
              veuillez consulter notre{" "}
              <Link href="/legal/politique-de-confidentialite" className="font-medium text-neutral-900 underline underline-offset-2 hover:opacity-70 transition-opacity">
                politique de confidentialité
              </Link>
              .
            </p>
          </Section>

          <Section number="05" title="Responsabilité">
            <p>
              L&apos;éditeur ne saurait être tenu responsable des dommages directs ou indirects
              résultant de l&apos;utilisation du site ou de l&apos;impossibilité d&apos;y accéder,
              y compris en cas de dysfonctionnement, interruption, bug ou indisponibilité du service.
            </p>
          </Section>

          <Section number="06" title="Liens externes">
            <p>
              Le site peut contenir des liens vers des sites tiers. L&apos;éditeur ne peut être tenu
              responsable du contenu ou du fonctionnement de ces sites externes.
            </p>
          </Section>

          <Section number="07" title="Droit applicable">
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige,
              et à défaut de résolution amiable, les tribunaux compétents seront ceux du ressort
              de l&apos;éditeur, sauf disposition légale contraire.
            </p>
          </Section>

        </div>

        <LegalNav current="mentions-legales" />
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
        <div className="text-[13px] sm:text-[15px] leading-relaxed text-neutral-700 space-y-2">
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
