'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, ModelProfile, PhotographerProfile, BrandProfile, ModelTag, PhotographerSpecialty, BrandType, CreativeType } from '@/src/types';
import { userStore } from '@/src/lib/userStore';
import { useCurrentUser } from '@/src/hooks/useCurrentUser';
import { createClient } from '@/src/lib/supabase/client';
import { userProfilesSupabase } from '@/src/lib/userProfilesSupabase';
import { applicationsStore } from '@/src/lib/applications';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Badge } from '@/src/components/ui/Badge';
import { Toast } from '@/src/components/ui/Toast';
import { Logo } from '@/src/components/Logo';
import { ImageUpload } from '@/src/components/ui/ImageUpload';
import { cn } from '@/src/lib/utils';

type OnboardingStep = 1 | 2 | 3;
const MAX_INLINE_MEDIA_LENGTH = 180_000;
const PROFILE_MEDIA_BUCKET = 'modl-media';

const compactMediaUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (value.startsWith('data:') && value.length > MAX_INLINE_MEDIA_LENGTH) {
    return undefined;
  }
  return value;
};

const compactMediaArray = (values?: Array<string | undefined>): string[] => {
  if (!values || values.length === 0) return [];
  return values
    .map((value) => compactMediaUrl(value))
    .filter((value): value is string => Boolean(value && value.trim()));
};

const cleanMediaArray = (values?: Array<string | undefined>): string[] => {
  if (!values || values.length === 0) return [];
  return values.filter((value): value is string => Boolean(value && value.trim()));
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export default function OnboardingPage() {
  const router = useRouter();
  const { user: currentUser } = useCurrentUser(false);
  const [step, setStep] = useState<OnboardingStep>(1);
  const [showToast, setShowToast] = useState(false);
  
  // Step 1: Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Step 2: Common info
  const [commonInfo, setCommonInfo] = useState({
    name: '',
    city: '',
    email: '',
    avatarUrl: '',
  });
  
  // Step 3: Role-specific info
  const [modelInfo, setModelInfo] = useState<Partial<ModelProfile>>({
    age: undefined,
    height: undefined,
    weight: undefined,
    eyeColor: '',
    hairColor: '',
    bio: '',
    portfolioImages: [''],
    tags: [],
    experienceYears: 0,
    gender: '',
    measurements: '',
    bust: undefined,
    waist: undefined,
    hips: undefined,
    shoeSize: undefined,
    dressSize: '',
    armCircumference: undefined,
    hairLength: '',
    skinTone: '',
  });
  
  const [photographerInfo, setPhotographerInfo] = useState<Partial<PhotographerProfile>>({
    bio: '',
    portfolioImages: [''],
    specialties: [],
    portfolioLink: '',
    equipment: '',
    style: '',
    creativeType: undefined,
  });
  const [showCreativeTypeSelection, setShowCreativeTypeSelection] = useState(false);
  const [showBrandTypeSelection, setShowBrandTypeSelection] = useState(false);
  
  const [brandInfo, setBrandInfo] = useState<Partial<BrandProfile>>({
    website: '',
    bio: '',
    logoUrl: '',
    brandType: undefined,
  });

  const retryPersistProfile = async <T,>(saveFn: () => Promise<T | null>, attempts = 3): Promise<T | null> => {
    for (let index = 0; index < attempts; index++) {
      const result = await saveFn();
      if (result) return result;
      if (index < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
    }
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedRole) return;
      if (selectedRole === 'PHOTOGRAPHER' && !photographerInfo.creativeType) {
        alert('Veuillez sélectionner votre type de créatif');
        return;
      }
      if (selectedRole === 'BRAND' && !brandInfo.brandType) {
        alert('Veuillez sélectionner votre type de marque');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!commonInfo.name || !commonInfo.city) return;
      setStep(3);
    } else if (step === 3) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      if (!selectedRole) return;
      
      // Validation selon le rôle
      if (selectedRole === 'MODEL') {
        if (!modelInfo.age || modelInfo.age < 18) {
          alert('L\'âge minimum pour un compte modèle est de 18 ans.');
          return;
        }
        if (!modelInfo.height || !modelInfo.weight || !modelInfo.portfolioImages?.some(img => img.trim())) {
          alert('Veuillez remplir au moins l\'âge (18+), la taille, le poids et une photo de portfolio');
          return;
        }
      } else if (selectedRole === 'PHOTOGRAPHER') {
        if (!photographerInfo.portfolioImages?.some(img => img.trim())) {
          alert('Veuillez ajouter au moins une photo de portfolio');
          return;
        }
      } else if (selectedRole === 'BRAND') {
        if (!commonInfo.name) {
          alert('Veuillez renseigner le nom de la marque');
          return;
        }
      }
      
      // Utiliser l'ID de l'utilisateur Supabase actuel, ou créer un nouvel ID si pas connecté
      let userId: string;
      if (currentUser?.id) {
        userId = currentUser.id;
        
        // Mettre à jour le rôle dans Supabase
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: selectedRole })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Erreur lors de la mise à jour du rôle dans Supabase:', updateError);
          // Continuer quand même avec la création locale
        }
      } else {
        // Fallback si pas d'utilisateur Supabase (ne devrait pas arriver normalement)
        userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const uploadProfileImage = async (
        maybeDataUrl: string | undefined,
        userIdToUse: string,
        scope: 'avatar' | 'portfolio' | 'logo',
        index = 0
      ): Promise<string | undefined> => {
        if (!maybeDataUrl || !maybeDataUrl.trim()) return undefined;
        if (!maybeDataUrl.startsWith('data:')) return maybeDataUrl;

        try {
          const supabase = createClient();
          const response = await fetch(maybeDataUrl);
          const blob = await response.blob();
          const extension = blob.type.split('/')[1] || 'jpg';
          const safeExtension = extension.split('+')[0];
          const filePath = `${userIdToUse}/${scope}-${Date.now()}-${index}.${safeExtension}`;

          const { error } = await supabase.storage
            .from(PROFILE_MEDIA_BUCKET)
            .upload(filePath, blob, {
              cacheControl: '3600',
              upsert: true,
              contentType: blob.type || 'image/jpeg',
            });

          if (error) {
            // Garder l'image d'origine en fallback pour éviter de "perdre" la photo.
            return maybeDataUrl;
          }

          const { data } = supabase.storage.from(PROFILE_MEDIA_BUCKET).getPublicUrl(filePath);
          return data.publicUrl || maybeDataUrl;
        } catch {
          // Fallback local si Storage indisponible temporairement.
          return maybeDataUrl;
        }
      };

      const uploadedAvatar = await uploadProfileImage(commonInfo.avatarUrl || undefined, userId, 'avatar', 0);

      const user = {
        id: userId,
        email: commonInfo.email || currentUser?.email || undefined,
        role: selectedRole,
        name: commonInfo.name,
        avatarUrl: uploadedAvatar,
        createdAt: new Date(),
      };
      
      userStore.setCurrentUser(user);
      
      // Créer le profil selon le rôle
      if (selectedRole === 'MODEL') {
        // Sécurité: un nouveau compte modèle doit démarrer sans candidature locale "fantôme".
        applicationsStore.clearByModelId(userId);
        const uploadedPortfolio = await Promise.all(
          (modelInfo.portfolioImages || []).map((img, index) =>
            uploadProfileImage(img, userId, 'portfolio', index)
          )
        );
        const profile: ModelProfile = {
          userId,
          name: commonInfo.name,
          email: commonInfo.email || undefined,
          avatarUrl: uploadedAvatar || commonInfo.avatarUrl || undefined,
          age: modelInfo.age,
          height: modelInfo.height!,
          weight: modelInfo.weight!,
          city: commonInfo.city,
          eyeColor: modelInfo.eyeColor || undefined,
          hairColor: modelInfo.hairColor || undefined,
          bio: modelInfo.bio || '',
          portfolioImages: cleanMediaArray(uploadedPortfolio),
          tags: modelInfo.tags || [],
          experienceYears: modelInfo.experienceYears,
          gender: modelInfo.gender || undefined,
          measurements: modelInfo.measurements || undefined,
          bust: modelInfo.bust,
          waist: modelInfo.waist,
          hips: modelInfo.hips,
          shoeSize: modelInfo.shoeSize,
          dressSize: modelInfo.dressSize || undefined,
          armCircumference: modelInfo.armCircumference,
          hairLength: modelInfo.hairLength || undefined,
          skinTone: modelInfo.skinTone || undefined,
        };
        userStore.setModelProfile(profile);
        if (isUuid(userId)) {
          const savedProfile = await retryPersistProfile(() => userProfilesSupabase.setModelProfile(profile));
          if (savedProfile) {
            userStore.setModelProfile(savedProfile);
          }
        }
      } else if (selectedRole === 'PHOTOGRAPHER') {
        const uploadedPortfolio = await Promise.all(
          (photographerInfo.portfolioImages || []).map((img, index) =>
            uploadProfileImage(img, userId, 'portfolio', index)
          )
        );
        const profile: PhotographerProfile = {
          userId,
          name: commonInfo.name,
          email: commonInfo.email || undefined,
          avatarUrl: uploadedAvatar || commonInfo.avatarUrl || undefined,
          city: commonInfo.city,
          bio: photographerInfo.bio || '',
          portfolioImages: cleanMediaArray(uploadedPortfolio),
          specialties: photographerInfo.specialties || [],
          portfolioLink: photographerInfo.portfolioLink || undefined,
          equipment: photographerInfo.equipment || undefined,
          style: photographerInfo.style || undefined,
          creativeType: photographerInfo.creativeType,
        };
        userStore.setPhotographerProfile(profile);
        if (isUuid(userId)) {
          const savedProfile = await retryPersistProfile(() => userProfilesSupabase.setPhotographerProfile(profile));
          if (savedProfile) {
            userStore.setPhotographerProfile(savedProfile);
          }
        }
      } else if (selectedRole === 'BRAND') {
        const uploadedLogo = await uploadProfileImage(brandInfo.logoUrl || undefined, userId, 'logo', 0);
        const profile: BrandProfile = {
          userId,
          companyName: commonInfo.name,
          email: commonInfo.email || undefined,
          website: brandInfo.website || undefined,
          city: commonInfo.city,
          bio: brandInfo.bio || '',
          logoUrl: uploadedLogo || brandInfo.logoUrl || undefined,
          brandType: brandInfo.brandType,
        };
        userStore.setBrandProfile(profile);
        if (isUuid(userId)) {
          const savedProfile = await retryPersistProfile(() => userProfilesSupabase.setBrandProfile(profile));
          if (savedProfile) {
            userStore.setBrandProfile(savedProfile);
          }
        }
      }
      
      setShowToast(true);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`modl_onboarding_done_${userId}`, '1');
        } catch (storageError) {
          console.warn('Impossible de persister le flag onboarding (stockage plein):', storageError);
        }
      }
      // Navigation client (sans hard reload) pour garder l'état fraîchement créé.
      setTimeout(() => {
        router.replace('/jobs');
      }, 800);
    } catch (error) {
      console.error('Erreur inattendue pendant la finalisation de l\'onboarding:', error);
      alert('Une erreur est survenue pendant la finalisation du profil. Veuillez réessayer.');
      return;
    }
  };

  const modelTags: ModelTag[] = ['RUNWAY', 'COMMERCIAL', 'EDITORIAL', 'FITNESS', 'BEAUTY', 'LIFESTYLE', 'E_COMMERCE'];
  const photographerSpecialties: PhotographerSpecialty[] = ['PORTRAIT', 'FASHION', 'STUDIO', 'OUTDOOR', 'WEDDING', 'EVENT', 'PRODUCT'];
  const brandTypes: BrandType[] = ['INDEPENDENT', 'E_COMMERCE', 'AGENCY', 'RETAIL_CHAIN', 'MEDIA', 'OTHER'];
  const brandSubTypes: { value: BrandType; label: string; description: string }[] = [
    { value: 'INDEPENDENT', label: 'Marque indépendante', description: 'Créateur, startup, petite marque' },
    { value: 'E_COMMERCE', label: 'E-commerce', description: 'Boutique en ligne, marketplace' },
    { value: 'AGENCY', label: 'Agence', description: 'Agence de communication, publicité' },
    { value: 'RETAIL_CHAIN', label: 'Grande marque', description: 'Grande enseigne, groupe, multinationale' },
    { value: 'MEDIA', label: 'Média', description: 'Magazine, plateforme de contenu, média digital' },
    { value: 'OTHER', label: 'Autre', description: 'Autre type de marque ou annonceur' },
  ];
  const creativeTypes: { value: CreativeType; label: string; description: string }[] = [
    { value: 'PHOTOGRAPHER', label: 'Photographe', description: 'Shooting photo, portraits, mode' },
    { value: 'ART_DIRECTOR', label: 'Directeur artistique', description: 'Pochettes d\'albums, clips vidéo, direction artistique' },
    { value: 'MAKEUP_ARTIST', label: 'Maquilleur / Maquilleuse', description: 'Maquillage artistique, beauté, effets spéciaux' },
    { value: 'VIDEO_FIGURATION', label: 'Figuration clips', description: 'Recherche de figurants pour clips vidéo musicaux' },
    { value: 'STYLIST', label: 'Styliste', description: 'Stylisme mode, création de looks' },
    { value: 'OTHER', label: 'Autre créatif', description: 'Autre profession créative' },
  ];

  return (
    <div
      className={cn(
        'fixed inset-0 bg-beige-50 px-4 py-6',
        step === 1 && selectedRole === 'MODEL'
          ? 'flex items-center justify-center overflow-hidden'
          : 'overflow-y-auto'
      )}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={cn(
          'w-full max-w-2xl',
          step === 1 && selectedRole === 'MODEL' ? '-mt-8 sm:-mt-10 mx-auto' : 'mx-auto'
        )}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Logo size="2xl" showText={false} href="/" rounded={true} />
        </div>
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Étape {step} sur 3</span>
            <span className="text-sm text-neutral-500">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-beige-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-beige-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Bienvenue sur MODL</h1>
              <p className="text-neutral-600">
                La plateforme casting dédiée à <span className="font-semibold text-beige-700">Paris et l&apos;Île-de-France</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['MODEL', 'PHOTOGRAPHER', 'BRAND'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  className={cn(
                    "w-full text-left rounded-2xl border transition-all duration-200 hover:shadow-lg select-none",
                    "focus:outline-none focus:ring-2 focus:ring-beige-500 focus:ring-offset-2",
                    "pointer-events-auto cursor-pointer z-10 relative", // S'assurer que les clics fonctionnent
                    selectedRole === role 
                      ? "border-beige-500 bg-beige-100 ring-2 ring-beige-300 shadow-md" 
                      : "border-beige-200 bg-white"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Button clicked:', role); // Debug
                    setSelectedRole(role);
                    if (role === 'PHOTOGRAPHER') {
                      setShowCreativeTypeSelection(true);
                      setShowBrandTypeSelection(false);
                    } else if (role === 'BRAND') {
                      setShowBrandTypeSelection(true);
                      setShowCreativeTypeSelection(false);
                    } else {
                      setShowCreativeTypeSelection(false);
                      setShowBrandTypeSelection(false);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Empêcher la sélection de texte
                  }}
                >
                  <div className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      {role === 'MODEL' && (
                        <svg className="w-12 h-12 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      )}
                      {role === 'PHOTOGRAPHER' && (
                        <svg className="w-12 h-12 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                      )}
                      {role === 'BRAND' && (
                        <svg className="w-12 h-12 text-beige-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75H21m-4.5 1.5H21" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {role === 'MODEL' ? 'Mannequin' : role === 'PHOTOGRAPHER' ? 'Créatif' : 'Marque / Annonceur'}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {role === 'MODEL' && 'Trouve des opportunités de shooting'}
                      {role === 'PHOTOGRAPHER' && 'Photographe, directeur artistique, maquilleur...'}
                      {role === 'BRAND' && 'Publie des annonces et trouve des talents'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Sélection du type de marque */}
            {selectedRole === 'BRAND' && showBrandTypeSelection && (
              <div className="mt-8 space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Quel type de marque es-tu ?</h2>
                  <p className="text-neutral-600">Sélectionne ta catégorie</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brandSubTypes.map((brandSubType) => (
                    <Card
                      key={brandSubType.value}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg",
                        brandInfo.brandType === brandSubType.value 
                          ? "border-beige-500 bg-beige-100" 
                          : "border-beige-200"
                      )}
                      onClick={() => setBrandInfo({ ...brandInfo, brandType: brandSubType.value })}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="mb-4 flex justify-center">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300",
                            brandInfo.brandType === brandSubType.value
                              ? "bg-beige-300 text-beige-700"
                              : "bg-beige-200/70 text-beige-600"
                          )}>
                            {brandSubType.value === 'INDEPENDENT' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                              </svg>
                            )}
                            {brandSubType.value === 'E_COMMERCE' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v.375H6.75z" />
                              </svg>
                            )}
                            {brandSubType.value === 'AGENCY' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 01-.75-.75v-4.25m0 0h4.5m-4.5 0l-1.5-1.5m1.5 1.5l-1.5-1.5m0 0l-1.5-1.5m1.5 1.5l1.5-1.5m-1.5 1.5l-1.5-1.5m0 0v-4.25m0 4.25h4.5m-4.5 0l-1.5 1.5m1.5-1.5l1.5 1.5m-1.5-1.5h-4.5m0 0l-1.5-1.5m1.5 1.5l-1.5-1.5m0 0h4.5m-4.5 0v-4.25m0 4.25H3.75m0 0l1.5-1.5m-1.5 1.5l-1.5-1.5m0 0h4.5m-4.5 0v4.25m0-4.25H3.75m0 0l1.5 1.5m-1.5-1.5l-1.5 1.5" />
                              </svg>
                            )}
                            {brandSubType.value === 'RETAIL_CHAIN' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75H21m-4.5 1.5H21" />
                              </svg>
                            )}
                            {brandSubType.value === 'MEDIA' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v4.5H6v-4.5z" />
                              </svg>
                            )}
                            {brandSubType.value === 'OTHER' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold text-neutral-900 mb-1">{brandSubType.label}</h4>
                        <p className="text-sm text-neutral-600">{brandSubType.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sélection du type de créatif */}
            {selectedRole === 'PHOTOGRAPHER' && showCreativeTypeSelection && (
              <div className="mt-8 space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Quel type de créatif es-tu ?</h2>
                  <p className="text-neutral-600">Sélectionne ta spécialité</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creativeTypes.map((creative) => (
                    <Card
                      key={creative.value}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg",
                        photographerInfo.creativeType === creative.value 
                          ? "border-beige-500 bg-beige-100" 
                          : "border-beige-200"
                      )}
                      onClick={() => setPhotographerInfo({ ...photographerInfo, creativeType: creative.value })}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="mb-4 flex justify-center">
                          <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300",
                            photographerInfo.creativeType === creative.value
                              ? "bg-beige-300 text-beige-700"
                              : "bg-beige-200/70 text-beige-600"
                          )}>
                            {creative.value === 'PHOTOGRAPHER' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                              </svg>
                            )}
                            {creative.value === 'ART_DIRECTOR' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                              </svg>
                            )}
                            {creative.value === 'MAKEUP_ARTIST' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12.553A2 2 0 0118.581 22H5.419a2 2 0 01-1.998-1.94L4.64 8.557m12.715 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                            {creative.value === 'VIDEO_FIGURATION' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                            )}
                            {creative.value === 'STYLIST' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                              </svg>
                            )}
                            {creative.value === 'OTHER' && (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold text-neutral-900 mb-1">{creative.label}</h4>
                        <p className="text-sm text-neutral-600">{creative.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Common Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Informations de base</h2>
              <p className="text-neutral-600">
                Remplis tes informations principales pour apparaître dans les castings à{' '}
                <span className="font-semibold text-beige-700">Paris / Île-de-France</span>
              </p>
            </div>
            
            <Card className="border-beige-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    {selectedRole === 'BRAND' ? 'Nom de la marque *' : 'Nom / Prénom *'}
                  </label>
                  <Input
                    value={commonInfo.name}
                    onChange={(e) => setCommonInfo({ ...commonInfo, name: e.target.value })}
                    placeholder={selectedRole === 'BRAND' ? 'Ex: Zara' : 'Ex: Sophie Martin'}
                    required
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Ville *</label>
                  <Input
                    value={commonInfo.city}
                    onChange={(e) => setCommonInfo({ ...commonInfo, city: e.target.value })}
                    placeholder="Ex: Paris"
                    required
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Email (optionnel)</label>
                  <Input
                    type="email"
                    value={commonInfo.email}
                    onChange={(e) => setCommonInfo({ ...commonInfo, email: e.target.value })}
                    placeholder="exemple@email.com"
                  />
                </div>
                
                <div>
                  <ImageUpload
                    images={commonInfo.avatarUrl ? [commonInfo.avatarUrl] : []}
                    onChange={(images) => setCommonInfo({ ...commonInfo, avatarUrl: images[0] || '' })}
                    maxImages={1}
                    label={selectedRole === 'BRAND' ? 'Logo' : 'Photo de profil'}
                    multiple={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Role-specific Info */}
        {step === 3 && selectedRole === 'MODEL' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Profil Mannequin</h2>
              <p className="text-neutral-600">Complète ton profil pour être visible</p>
            </div>
            
            <Card className="border-beige-200">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Taille (cm) *</label>
                    <Input
                      type="number"
                      value={modelInfo.height || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, height: parseInt(e.target.value) || undefined })}
                      placeholder="170"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Poids (kg) *</label>
                    <Input
                      type="number"
                      value={modelInfo.weight || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, weight: parseInt(e.target.value) || undefined })}
                      placeholder="60"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Âge (18 ans minimum) *</label>
                    <Input
                      type="number"
                      min="18"
                      value={modelInfo.age || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, age: parseInt(e.target.value) || undefined })}
                      placeholder="18"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Genre (optionnel)</label>
                    <Input
                      value={modelInfo.gender || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, gender: e.target.value })}
                      placeholder="Femme, Homme, Non-binaire..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Couleur des yeux</label>
                    <Input
                      value={modelInfo.eyeColor || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, eyeColor: e.target.value })}
                      placeholder="Bleus, Marrons..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Couleur des cheveux</label>
                    <Input
                      value={modelInfo.hairColor || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, hairColor: e.target.value })}
                      placeholder="Blond, Brun..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Longueur cheveux</label>
                    <Input
                      value={modelInfo.hairLength || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, hairLength: e.target.value })}
                      placeholder="Court, Mi-long, Long..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Teint de peau</label>
                    <Input
                      value={modelInfo.skinTone || ''}
                      onChange={(e) => setModelInfo({ ...modelInfo, skinTone: e.target.value })}
                      placeholder="Clair, Moyen, Foncé..."
                    />
                  </div>
                </div>

                {/* Mensurations détaillées */}
                <div className="border-t border-beige-200 pt-4">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">Mensurations détaillées</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Tour de poitrine (cm)</label>
                      <Input
                        type="number"
                        value={modelInfo.bust || ''}
                        onChange={(e) => setModelInfo({ ...modelInfo, bust: parseInt(e.target.value) || undefined })}
                        placeholder="85"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Tour de taille (cm)</label>
                      <Input
                        type="number"
                        value={modelInfo.waist || ''}
                        onChange={(e) => setModelInfo({ ...modelInfo, waist: parseInt(e.target.value) || undefined })}
                        placeholder="65"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Tour de hanches (cm)</label>
                      <Input
                        type="number"
                        value={modelInfo.hips || ''}
                        onChange={(e) => setModelInfo({ ...modelInfo, hips: parseInt(e.target.value) || undefined })}
                        placeholder="90"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Pointure</label>
                      <Input
                        type="number"
                        value={modelInfo.shoeSize || ''}
                        onChange={(e) => setModelInfo({ ...modelInfo, shoeSize: parseInt(e.target.value) || undefined })}
                        placeholder="38"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Taille vêtement</label>
                      <Input
                        value={modelInfo.dressSize || ''}
                        onChange={(e) => setModelInfo({ ...modelInfo, dressSize: e.target.value })}
                        placeholder="36, 38, S, M..."
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-700">Tour de bras (cm)</label>
                      <Input
                        type="number"
                        value={modelInfo.armCircumference || ''}
                        onChange={(e) => setModelInfo({ ...modelInfo, armCircumference: parseInt(e.target.value) || undefined })}
                        placeholder="28"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Années d'expérience</label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    value={modelInfo.experienceYears || 0}
                    onChange={(e) => setModelInfo({ ...modelInfo, experienceYears: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    rows={3}
                    value={modelInfo.bio || ''}
                    onChange={(e) => setModelInfo({ ...modelInfo, bio: e.target.value })}
                    placeholder="Présente-toi brièvement..."
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Compétences / Tags *</label>
                  <div className="flex flex-wrap gap-2">
                    {modelTags.map((tag) => {
                      const isSelected = modelInfo.tags?.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? 'primary' : 'default'}
                          className="cursor-pointer"
                          onClick={() => {
                            const tags = modelInfo.tags || [];
                            if (isSelected) {
                              setModelInfo({ ...modelInfo, tags: tags.filter(t => t !== tag) });
                            } else {
                              setModelInfo({ ...modelInfo, tags: [...tags, tag] });
                            }
                          }}
                        >
                          {tag === 'RUNWAY' ? 'Runway' : tag === 'COMMERCIAL' ? 'Commercial' : tag === 'EDITORIAL' ? 'Éditorial' : tag === 'FITNESS' ? 'Fitness' : tag === 'BEAUTY' ? 'Beauté' : tag === 'LIFESTYLE' ? 'Lifestyle' : 'E-commerce'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <ImageUpload
                    images={modelInfo.portfolioImages?.filter(img => img.trim()) || []}
                    onChange={(images) => setModelInfo({ ...modelInfo, portfolioImages: images })}
                    maxImages={6}
                    label="Portfolio (au moins 1 obligatoire) *"
                    multiple={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && selectedRole === 'PHOTOGRAPHER' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Profil {photographerInfo.creativeType ? creativeTypes.find(c => c.value === photographerInfo.creativeType)?.label || 'Créatif' : 'Créatif'}
              </h2>
              <p className="text-neutral-600">Présente ton travail et tes spécialités</p>
            </div>
            
            <Card className="border-beige-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Bio</label>
                  <textarea
                    className="w-full rounded-lg border border-beige-300 p-3 text-sm focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20"
                    rows={3}
                    value={photographerInfo.bio || ''}
                    onChange={(e) => setPhotographerInfo({ ...photographerInfo, bio: e.target.value })}
                    placeholder="Présente-toi et ton style..."
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Spécialités</label>
                  <div className="flex flex-wrap gap-2">
                    {photographerSpecialties.map((specialty) => {
                      const isSelected = photographerInfo.specialties?.includes(specialty);
                      return (
                        <Badge
                          key={specialty}
                          variant={isSelected ? 'primary' : 'default'}
                          className="cursor-pointer"
                          onClick={() => {
                            const specialties = photographerInfo.specialties || [];
                            if (isSelected) {
                              setPhotographerInfo({ ...photographerInfo, specialties: specialties.filter(s => s !== specialty) });
                            } else {
                              setPhotographerInfo({ ...photographerInfo, specialties: [...specialties, specialty] });
                            }
                          }}
                        >
                          {specialty === 'PORTRAIT' ? 'Portrait' : specialty === 'FASHION' ? 'Mode' : specialty === 'STUDIO' ? 'Studio' : specialty === 'OUTDOOR' ? 'Extérieur' : specialty === 'WEDDING' ? 'Mariage' : specialty === 'EVENT' ? 'Événement' : 'Produit'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Lien portfolio (site / Instagram)</label>
                  <Input
                    value={photographerInfo.portfolioLink || ''}
                    onChange={(e) => setPhotographerInfo({ ...photographerInfo, portfolioLink: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <ImageUpload
                    images={photographerInfo.portfolioImages?.filter(img => img.trim()) || []}
                    onChange={(images) => setPhotographerInfo({ ...photographerInfo, portfolioImages: images })}
                    maxImages={6}
                    label="Galerie (au moins 1 obligatoire) *"
                    multiple={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && selectedRole === 'BRAND' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Profil Marque</h2>
              <p className="text-neutral-600">Présente ta marque et ce que tu recherches</p>
            </div>
            
            <Card className="border-beige-200">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Site web (optionnel)</label>
                  <Input
                    value={brandInfo.website || ''}
                    onChange={(e) => setBrandInfo({ ...brandInfo, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Type de marque</label>
                  <div className="flex flex-wrap gap-2">
                    {brandTypes.map((type) => {
                      const isSelected = brandInfo.brandType === type;
                      return (
                        <Badge
                          key={type}
                          variant={isSelected ? 'primary' : 'default'}
                          className="cursor-pointer"
                          onClick={() => setBrandInfo({ ...brandInfo, brandType: type })}
                        >
                          {type === 'INDEPENDENT' ? 'Marque indépendante' : type === 'E_COMMERCE' ? 'E-commerce' : type === 'AGENCY' ? 'Agence' : type === 'RETAIL_CHAIN' ? 'Grande enseigne' : type === 'MEDIA' ? 'Média' : 'Autre'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Bio / Description</label>
                  <textarea
                    className="w-full rounded-lg border border-beige-300 p-3 text-sm focus:border-beige-500 focus:ring-2 focus:ring-beige-500/20"
                    rows={4}
                    value={brandInfo.bio || ''}
                    onChange={(e) => setBrandInfo({ ...brandInfo, bio: e.target.value })}
                    placeholder="Décris ta marque et ce que tu recherches..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => {
              if (step > 1) {
                setStep((step - 1) as OnboardingStep);
              } else {
                router.push('/auth');
              }
            }}
            className="border-beige-300 hover:bg-beige-100"
          >
            {step === 1 ? 'Annuler' : 'Retour'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              (step === 1 && !selectedRole) ||
              (step === 2 && (!commonInfo.name || !commonInfo.city))
            }
            variant="beige"
          >
            {step === 3 ? 'Terminer' : 'Continuer'}
          </Button>
        </div>
      </div>
      
      {showToast && (
        <Toast
          message="Profil créé avec succès ! ✅"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
