'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { JobPost, JobType, PayType } from '@/src/types';
import { jobsStore } from '@/src/lib/jobs';
import { jobsStoreSupabase } from '@/src/lib/jobsSupabase';
import { listingQuota } from '@/src/lib/listingQuota';
import { BETA_COPY, IS_BETA } from '@/src/lib/beta';
import { createClient } from '@/src/lib/supabase/client';
import { ListingQuotaGate, CreditPack } from '@/src/components/ListingQuotaGate';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { DatePicker } from '@/src/components/ui/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/Tabs';
import { Toast } from '@/src/components/ui/Toast';
import { ImageUpload } from '@/src/components/ui/ImageUpload';

const JOB_MEDIA_BUCKET = 'modl-media';

export default function PostJobPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireUser();
  const [formData, setFormData] = useState({
    title: '',
    type: 'FASHION' as JobType,
    location: '',
    date: '',
    duration: '',
    payAmount: '',
    payType: 'PAID' as PayType,
    description: '',
    deliverables: '',
    referenceImages: [] as string[],
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Annonce publiee avec succes !');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Quota d'annonces
  const [quotaReady, setQuotaReady] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [remaining, setRemaining] = useState(1);
  const [resetLabel, setResetLabel] = useState('');
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);

  // Liste des lieux autorisés : Paris + Île-de-France
  const allowedLocations = useMemo(
    () => [
      'Paris 1er', 'Paris 2e', 'Paris 3e', 'Paris 4e', 'Paris 5e',
      'Paris 6e', 'Paris 7e', 'Paris 8e', 'Paris 9e', 'Paris 10e',
      'Paris 11e', 'Paris 12e', 'Paris 13e', 'Paris 14e', 'Paris 15e',
      'Paris 16e', 'Paris 17e', 'Paris 18e', 'Paris 19e', 'Paris 20e',
      'Hauts-de-Seine (92)', 'Seine-Saint-Denis (93)', 'Val-de-Marne (94)',
      "Val-d'Oise (95)", 'Seine-et-Marne (77)', 'Yvelines (78)', 'Essonne (91)',
      'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil',
      'Nanterre', 'Créteil', 'Aubervilliers', 'Aulnay-sous-Bois',
      'Asnières-sur-Seine', 'Colombes', 'Rueil-Malmaison', 'Champigny-sur-Marne',
      'Drancy', 'Antony', 'Issy-les-Moulineaux', 'Noisy-le-Grand',
      'Courbevoie', 'Vitry-sur-Seine', 'Cergy', 'Versailles',
      'Levallois-Perret', 'Neuilly-sur-Seine', 'Clichy', 'Pantin',
      'Ivry-sur-Seine', 'Sarcelles', 'Bondy', 'Épinay-sur-Seine',
      'Montrouge', 'Meaux', 'Chelles', 'Évry', 'Fontenay-sous-Bois',
      'Rosny-sous-Bois', 'Saint-Maur-des-Fossés', 'Gennevilliers',
      'Les Lilas', 'Bagnolet', 'Bobigny', 'Vincennes', 'Charenton-le-Pont',
      'Saint-Ouen', 'Clamart', 'Malakoff', 'Bourg-la-Reine',
      'Châtenay-Malabry', 'Sceaux', 'Vanves', 'Bagneux',
      'Fontenay-aux-Roses', 'Le Plessis-Robinson', 'Meudon', 'Puteaux',
      'Suresnes', 'Saint-Cloud', 'Sèvres', 'Chaville',
      'Vélizy-Villacoublay', 'Viroflay', 'Garches', 'La Garenne-Colombes',
      'Bois-Colombes', 'Fresnes', 'Rungis', 'Thiais', 'Orly',
      'Villeneuve-le-Roi', 'Villeneuve-Saint-Georges', 'Joinville-le-Pont',
      'Nogent-sur-Marne', 'Le Perreux-sur-Marne', 'Bry-sur-Marne',
      'Maisons-Alfort', 'Alfortville', "L'Haÿ-les-Roses", 'Cachan',
      'Arcueil', 'Gentilly', 'Le Kremlin-Bicêtre', 'Villejuif',
      'Choisy-le-Roi', 'Boissy-Saint-Léger', 'Sucy-en-Brie',
      'Chennevières-sur-Marne', 'Montgeron', 'Vigneux-sur-Seine',
      'Draveil', 'Soisy-sur-Seine', 'Corbeil-Essonnes', 'Torcy',
      'Lagny-sur-Marne', 'Noisiel', 'Pontault-Combault', 'Roissy-en-Brie',
      'Fontainebleau', 'Melun',
    ],
    []
  );

  const filteredLocations = useMemo(() => {
    const q = locationInput.trim().toLowerCase();
    if (!q) return allowedLocations.slice(0, 8);
    return allowedLocations.filter((loc) => loc.toLowerCase().includes(q)).slice(0, 10);
  }, [allowedLocations, locationInput]);

  // Bloquer le scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // Nettoyage stockage local non essentiel (libère de la place pour annonces/profils)
  useEffect(() => {
    try {
      localStorage.removeItem('modl_messages_v2');
      localStorage.removeItem('modl_threads_v2');
    } catch {
      // no-op
    }
  }, []);

  // Rediriger si mauvais role
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER'))) {
      router.push('/jobs');
    }
  }, [user, isLoading, router]);

  // Charger le quota une fois l'user connu
  useEffect(() => {
    if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) return;
    let r = listingQuota.remaining(user.id);

    // Rechargement auto pour les tests internes quand le quota est à zero.
    // Evite de bloquer la publication pendant les itérations produit.
    if (r === 0) {
      listingQuota.addCredits(user.id, 10);
      r = listingQuota.remaining(user.id);
    }

    setRemaining(r);
    setCanPost(r > 0);
    setResetLabel(listingQuota.labelUntilReset(user.id));
    setQuotaReady(true);
  }, [user]);

  if (isLoading || !quotaReady) {
    return (
      <div className="h-screen bg-beige-50 flex items-center justify-center overflow-hidden">
        <div className="text-neutral-600">Chargement...</div>
      </div>
    );
  }

  if (!user || (user.role !== 'BRAND' && user.role !== 'PHOTOGRAPHER')) {
    return null;
  }

  // --- Achat de credits (simulation — a remplacer par Stripe) ---
  const handleBuyCredits = async (pack: CreditPack) => {
    setIsBuyingCredits(true);
    // Simulation paiement 1.5s
    await new Promise((r) => setTimeout(r, 1500));
    listingQuota.addCredits(user.id, pack.listings);
    const r = listingQuota.remaining(user.id);
    setRemaining(r);
    setCanPost(r > 0);
    setToastMessage(`${pack.listings} annonce${pack.listings > 1 ? 's' : ''} ajoutee${pack.listings > 1 ? 's' : ''} a votre quota !`);
    setShowToast(true);
    setIsBuyingCredits(false);
  };

  // --- Soumission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    // Verif quota (securite front)
    if (!listingQuota.canPost(user.id)) {
      setCanPost(false);
      return;
    }

    if (!allowedLocations.includes(formData.location)) {
      alert('Merci de choisir un lieu uniquement a Paris ou en Ile-de-France dans la liste proposee.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadJobReferenceImage = async (
        maybeDataUrl: string,
        userIdToUse: string,
        index: number
      ): Promise<string> => {
        if (!maybeDataUrl || !maybeDataUrl.trim()) return maybeDataUrl;
        if (!maybeDataUrl.startsWith('data:')) return maybeDataUrl;

        try {
          const supabase = createClient();
          const response = await fetch(maybeDataUrl);
          const blob = await response.blob();
          const extension = blob.type.split('/')[1] || 'jpg';
          const safeExtension = extension.split('+')[0];
          const filePath = `${userIdToUse}/jobs/reference-${Date.now()}-${index}.${safeExtension}`;

          const { error } = await supabase.storage
            .from(JOB_MEDIA_BUCKET)
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: blob.type || 'image/jpeg',
            });

          if (error) {
            return maybeDataUrl;
          }

          const { data } = supabase.storage.from(JOB_MEDIA_BUCKET).getPublicUrl(filePath);
          return data.publicUrl || maybeDataUrl;
        } catch {
          return maybeDataUrl;
        }
      };

      const uploadedReferenceImages = await Promise.all(
        (formData.referenceImages || []).map((img, index) =>
          uploadJobReferenceImage(img, user.id, index)
        )
      );

      const jobDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      jobDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((jobDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isExpressCasting = diffDays >= 0 && diffDays <= 3;

      const newJob: JobPost = {
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ownerUserId: user.id,
        ownerRole: user.role === 'BRAND' ? 'BRAND' : 'PHOTOGRAPHER',
        title: formData.title,
        type: formData.type,
        location: formData.location,
        date: new Date(formData.date),
        duration: formData.duration,
        payAmount: formData.payType === 'PAID' && formData.payAmount ? parseFloat(formData.payAmount) : null,
        payType: formData.payType,
        description: formData.description,
        deliverables: formData.deliverables.split('\n').map((d) => d.trim()).filter((d) => d.length > 0),
        referenceImages: uploadedReferenceImages,
        createdAt: new Date(),
        isExpressCasting,
      };

      const localSaveOk = jobsStore.add(newJob);
      if (!localSaveOk) {
        setToastMessage("Impossible de sauvegarder l'annonce sur cet appareil (stockage plein). Réduisez les images puis réessayez.");
        setShowToast(true);
        setIsSubmitting(false);
        return;
      }

      const isUuidUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      if (isUuidUser) {
        const savedInSupabase = await jobsStoreSupabase.add(newJob);
        if (!savedInSupabase) {
          // Garder l'annonce locale visible pour ne pas perdre le travail utilisateur.
          // On avertit simplement que la synchro serveur a échoué.
          setToastMessage("Annonce publiée en local, mais la synchronisation Supabase a échoué. Vérifie Supabase (session/RLS/projet actif).");
          setShowToast(true);
        }
      }

      // Consommer 1 slot de quota APRES sauvegarde reussie
      listingQuota.recordPost(user.id);
      const newRemaining = listingQuota.remaining(user.id);
      setRemaining(newRemaining);
      setCanPost(newRemaining > 0);

      const remainingMsg = newRemaining === 0
        ? "Il ne te reste plus d'annonce gratuite ce mois-ci."
        : `Il te reste ${newRemaining} annonce${newRemaining > 1 ? 's' : ''} ce mois-ci.`;
      setToastMessage(`Annonce publiee ! ${remainingMsg}`);
      setShowToast(true);

      // Reset formulaire
      setFormData({
        title: '', type: 'FASHION', location: '', date: '', duration: '',
        payAmount: '', payType: 'PAID', description: '', deliverables: '', referenceImages: [],
      });
      setLocationInput('');

      setTimeout(() => {
        setIsSubmitting(false);
        try {
          localStorage.setItem('modl_last_created_job', JSON.stringify(newJob));
        } catch {
          // no-op
        }
        router.push(`/jobs?createdJobId=${newJob.id}`);
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la creation de l'annonce:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col relative backdrop-blur-[0.5px]">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 30% 50%, #000 1px, transparent 1px),
                          radial-gradient(circle at 70% 50%, #000 1px, transparent 1px)`,
        backgroundSize: '52px 52px',
      }} />
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 relative z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-12 pt-6 sm:pt-12 md:pt-16 pb-6">

          {/* En-tete */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-beige-600">
                  Pour vous
                </p>
                <h1 className="font-display mb-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
                  Publier une <span className="italic text-beige-700">annonce</span>
                </h1>
                <p className="text-sm sm:text-base text-neutral-500">
                  Publiez vos annonces et trouvez les bons profils
                </p>
              </div>
              {/* Badge quota */}
              <div className={`flex items-center gap-2 self-start mt-1 rounded-full border-2 px-3.5 py-2 text-sm font-bold shadow-sm ${
                remaining === 0
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-beige-400 bg-beige-100 text-beige-900'
              }`}>
                <svg className={`h-4 w-4 flex-shrink-0 ${remaining === 0 ? 'text-red-600' : 'text-beige-700'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-base leading-none">{IS_BETA ? '∞' : remaining}</span>
                <span className="leading-none">
                  {IS_BETA ? BETA_COPY.listingsLabel : `annonce${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''} ce mois`}
                </span>
              </div>
            </div>
          </div>

          {/* GATE : quota epuise */}
          {!canPost ? (
            <ListingQuotaGate
              resetLabel={resetLabel}
              onBuyCredits={handleBuyCredits}
              isBuying={isBuyingCredits}
            />
          ) : (
            /* FORMULAIRE NORMAL */
            <Card className="border-beige-200">
              <CardHeader>
                <CardTitle className="text-neutral-900">Nouvelle annonce</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Titre</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Type</label>
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <Tabs
                        defaultValue="FASHION"
                        value={formData.type}
                        onValueChange={(v) => setFormData({ ...formData, type: v as JobType })}
                      >
                        <TabsList className="w-max sm:w-full inline-flex">
                          <TabsTrigger value="FASHION" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Mode</TabsTrigger>
                          <TabsTrigger value="BEAUTY" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Beaute</TabsTrigger>
                          <TabsTrigger value="COMMERCIAL" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Commercial</TabsTrigger>
                          <TabsTrigger value="EDITORIAL" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Editorial</TabsTrigger>
                          <TabsTrigger value="OTHER" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4">Autre</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  <div className="relative">
                    <label className="mb-2 block text-sm font-medium text-neutral-700">
                      Lieu (Paris / Ile-de-France uniquement)
                    </label>
                    <Input
                      value={locationInput}
                      onChange={(e) => { setLocationInput(e.target.value); setShowLocationDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowLocationDropdown(false), 120)}
                      onFocus={() => setShowLocationDropdown(true)}
                      placeholder="Commencez a taper : Paris 11e, Boulogne-Billancourt..."
                      required
                    />
                    {showLocationDropdown && filteredLocations.length > 0 && (
                      <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-beige-200 bg-white shadow-lg custom-scrollbar">
                        {filteredLocations.map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-neutral-800 hover:bg-beige-50"
                            onClick={() => {
                              setLocationInput(loc);
                              setFormData({ ...formData, location: loc });
                              setShowLocationDropdown(false);
                            }}
                          >
                            {loc}
                          </button>
                        ))}
                        <div className="border-t border-beige-100 px-3 py-1.5 text-[11px] text-neutral-400">
                          Castings limites a Paris et l&apos;Ile-de-France.
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Date</label>
                      <DatePicker
                        value={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                        minDate={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Duree</label>
                      <Input
                        placeholder="ex: 4h, 1 jour"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Info Casting Express */}
                  <div className="relative p-3 sm:p-4 bg-gradient-to-br from-amber-50 via-beige-50 to-white rounded-xl border-2 border-amber-200 shadow-sm overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/20 to-beige-200/20 rounded-full blur-3xl -mr-12 -mt-12" />
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-500 p-2 sm:p-2.5 rounded-xl shadow-md">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 mb-1">Casting Express automatique</h4>
                        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                          Si votre shooting a lieu dans <strong className="text-amber-700">moins de 3 jours</strong>, votre annonce sera automatiquement marquee comme &ldquo;Casting Express&rdquo; et mise en avant.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Remuneration</label>
                    <Tabs
                      defaultValue="PAID"
                      value={formData.payType}
                      onValueChange={(v) => setFormData({ ...formData, payType: v as PayType })}
                    >
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="PAID" className="text-xs sm:text-sm">Remunere</TabsTrigger>
                        <TabsTrigger value="UNPAID" className="text-xs sm:text-sm">Collaboration</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    {formData.payType === 'PAID' && (
                      <Input
                        type="number"
                        placeholder="Montant en €"
                        value={formData.payAmount}
                        onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs sm:text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      className="w-full rounded-lg border border-beige-300 p-2 sm:p-3 text-sm focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="rounded-xl border border-beige-200 bg-beige-50/60 px-3 sm:px-4 py-3 text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                    <p className="font-semibold text-neutral-800 mb-1">Rappel — contrats &amp; droits a l&apos;image</p>
                    <p>
                      Les contrats, paiements et droits a l&apos;image sont conclus directement entre votre marque et les
                      talents selectionnes. MODL fournit uniquement un outil de mise en relation.
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs sm:text-sm font-medium text-neutral-700">Livrables (un par ligne)</label>
                    <textarea
                      className="w-full rounded-lg border border-beige-300 p-2 sm:p-3 text-sm focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20"
                      rows={3}
                      value={formData.deliverables}
                      onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                      placeholder="20 photos retouchees&#10;Droits usage commercial"
                    />
                  </div>
                  <div>
                    <ImageUpload
                      images={formData.referenceImages}
                      onChange={(images) => setFormData({ ...formData, referenceImages: images })}
                      maxImages={10}
                      label="Images de reference"
                      multiple={true}
                    />
                  </div>

                  {/* Info boost */}
                  <div className="relative p-3 sm:p-4 bg-gradient-to-br from-neutral-50 via-white to-white rounded-xl border-2 border-neutral-800 shadow-lg overflow-hidden ring-1 ring-neutral-200">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-neutral-200/20 to-neutral-300/10 rounded-full blur-3xl -mr-12 -mt-12" />
                    <div className="flex items-start gap-3 relative z-10">
                      <div className="flex-shrink-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-2 sm:p-2.5 rounded-xl shadow-lg ring-1 ring-neutral-700/50">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-neutral-900 mb-1">Envie de booster votre annonce ?</h4>
                        <p className="text-xs sm:text-sm text-neutral-700 mb-2 leading-relaxed">
                          Apres publication, vous pourrez booster votre annonce depuis votre profil pour qu&apos;elle apparaisse en premier.
                        </p>
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-neutral-300/50 shadow-sm">
                          <span className="text-xs font-bold text-neutral-800">A partir de 15€</span>
                          <span className="text-xs text-neutral-600">pour 3 jours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base"
                    size="lg"
                    variant="beige"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Publication...' : "Publier l'annonce"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
