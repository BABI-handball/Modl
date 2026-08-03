import Link from "next/link";
import { CONTACT_EMAIL } from "@/src/lib/beta";

export default function ConditionsGeneralesPage() {
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
              Conditions générales d&apos;utilisation
            </h1>
            <p className="text-sm text-neutral-400">
              Dernière mise à jour : 3 août 2026
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-5 sm:px-12 py-10 sm:py-16 pb-32">
        <div className="rounded-3xl border border-beige-200/80 bg-white/85 shadow-[0_18px_45px_rgba(0,0,0,0.06)] backdrop-blur-md px-5 sm:px-10 py-8 sm:py-12 space-y-10 text-[15px] leading-relaxed md:text-[16px]">

          <div className="pl-9 text-base leading-[1.85] text-neutral-600 space-y-3 pb-8 border-b border-neutral-900/6">
            <p>
              Les présentes conditions générales d&apos;utilisation (les &quot;CGU&quot;) ont pour
              objet d&apos;encadrer l&apos;accès et l&apos;utilisation de la plateforme MODL
              (la &quot;Plateforme&quot;), éditée par la société indiquée dans les mentions légales
              (&quot;Nous&quot;).
            </p>
            <p>
              En créant un compte ou en utilisant la Plateforme, vous acceptez sans réserve les
              présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser
              la Plateforme.
            </p>
          </div>

          <Section number="01" title="Objet de la Plateforme">
            <p>
              MODL met en relation des marques, enseignes, agences et professionnels de
              l&apos;image (&quot;Marques&quot;) avec des modèles, talents et créatifs
              (&quot;Talents&quot;) dans le cadre de castings, shootings et projets similaires.
              MODL n&apos;est pas partie aux contrats conclus entre les utilisateurs et n&apos;agit
              qu&apos;en tant qu&apos;intermédiaire technique.
            </p>
          </Section>

          <Section number="02" title="Création de compte">
            <p>
              Pour accéder à certaines fonctionnalités, vous devez créer un compte et fournir des
              informations exactes, complètes et à jour. Vous êtes responsable du maintien de la
              confidentialité de vos identifiants ainsi que de toutes les activités effectuées avec
              votre compte.
            </p>
          </Section>

          <Section number="03" title="Comportement des utilisateurs">
            <p>
              Vous vous engagez à utiliser la Plateforme dans le respect des lois applicables, des
              droits des tiers et des présentes CGU. Sont notamment interdits : les contenus
              discriminatoires, offensants ou illégaux, la diffusion d&apos;annonces trompeuses,
              ainsi que toute tentative de fraude ou d&apos;usurpation d&apos;identité.
            </p>
          </Section>

          <Section number="04" title="Rôle de MODL">
            <p>
              MODL fournit un outil de mise en relation et de gestion des candidatures. Nous ne
              garantissons ni la conclusion ni la bonne exécution des contrats entre Marques et
              Talents, et ne pouvons être tenus responsables des engagements pris entre utilisateurs.
            </p>
            <p>
              Les contrats (dont les contrats de travail ou de prestation), les paiements, ainsi que
              les droits à l&apos;image et d&apos;exploitation des contenus sont conclus directement
              entre les utilisateurs concernés (Marques / créatifs et Talents). MODL n&apos;est pas
              partie à ces contrats et n&apos;intervient pas dans la négociation ni dans le suivi
              de ces engagements.
            </p>
          </Section>

          <Section number="05" title="Propriété intellectuelle">
            <p>
              La Plateforme, sa structure et ses contenus (hors contenus fournis par les utilisateurs)
              sont protégés par les lois en vigueur relatives à la propriété intellectuelle. Toute
              reproduction ou utilisation non autorisée est interdite.
            </p>
          </Section>

          <Section number="06" title="Durée, suspension et résiliation">
            <p>
              Nous nous réservons le droit de suspendre ou de supprimer tout compte en cas de
              non-respect des présentes CGU, sans préavis ni indemnité, notamment en cas de
              comportement abusif, frauduleux ou contraire aux lois en vigueur.
            </p>
          </Section>

          <Section number="07" title="Évolution des conditions">
            <p>
              Nous pouvons modifier les présentes CGU à tout moment pour les adapter à
              l&apos;évolution de la Plateforme ou de la réglementation. La version en vigueur est
              celle publiée sur cette page. En continuant d&apos;utiliser la Plateforme après une
              mise à jour, vous acceptez les nouvelles conditions.
            </p>
          </Section>

          <Section number="08" title="Contact">
            <p>
              Pour toute question concernant ces conditions générales d&apos;utilisation, vous pouvez
              nous contacter à{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-neutral-900 underline underline-offset-2 hover:opacity-70 transition-opacity">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

        </div>

        <LegalNav current="conditions-generales" />
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-4 mb-3">
        <span className="text-xs font-mono text-neutral-300 shrink-0 pt-0.5">{number}</span>
        <h2 className="text-base font-semibold text-neutral-900 tracking-tight">{title}</h2>
      </div>
      <div className="pl-9 text-base leading-[1.85] text-neutral-600 space-y-3">
        {children}
      </div>
      <div className="mt-8 h-px bg-neutral-900/6" />
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
