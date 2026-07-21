'use client';

import { User, UserRole, ModelProfile, BrandProfile, PhotographerProfile } from '@/src/types';
import { userStore } from './userStore';
import { auth } from './auth';
import { getPortfolioImages, PORTFOLIO_IMAGE_URL } from './portfolioImage';
import { creditsStore } from './credits';

// Comptes de développement pré-configurés
export const devAccounts = {
  // Créer un compte modèle complet avec toutes les mensurations
  createModelAccount: (): { user: User; profile: ModelProfile } => {
    const userId = 'dev-model-1';
    const user: User = {
      id: userId,
      email: 'modele@test.com',
      role: 'MODEL',
      name: 'Sophie Martin',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date(),
    };

    const profile: ModelProfile = {
      userId,
      name: 'Sophie Martin',
      email: 'modele@test.com',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      age: 24,
      height: 175,
      weight: 58,
      city: 'Paris',
      eyeColor: 'Bleus',
      hairColor: 'Blond',
      bio: 'Mannequin passionnée par la mode et la photographie. Disponible pour divers projets créatifs.',
      portfolioImages: getPortfolioImages(),
      tags: ['RUNWAY', 'COMMERCIAL', 'EDITORIAL', 'BEAUTY'],
      experienceYears: 3,
      gender: 'Femme',
      bust: 86,
      waist: 62,
      hips: 90,
      shoeSize: 38,
      dressSize: '36',
      hairLength: 'Long',
      skinTone: 'Clair',
      armCircumference: 28,
    };

    return { user, profile };
  },

  // Créer un nouveau compte modèle complet avec toutes les mensurations (pour test)
  createNewModelAccount: (): { user: User; profile: ModelProfile } => {
    const userId = 'user-new-model';
    const user: User = {
      id: userId,
      email: 'sophie.new@email.com',
      role: 'MODEL',
      name: 'Sophie Martin',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date(),
    };

    const profile: ModelProfile = {
      userId,
      name: 'Sophie Martin',
      email: 'sophie.new@email.com',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      age: 24,
      height: 175,
      weight: 58,
      city: 'Paris',
      eyeColor: 'Bleus',
      hairColor: 'Blond',
      bio: 'Mannequin freelance spécialisée en mode et beauté. Expérience de 3 ans dans l\'industrie.',
      portfolioImages: getPortfolioImages(),
      tags: ['RUNWAY', 'COMMERCIAL', 'EDITORIAL', 'BEAUTY'],
      experienceYears: 3,
      gender: 'Femme',
      bust: 86,
      waist: 62,
      hips: 90,
      shoeSize: 38,
      dressSize: '36',
      hairLength: 'Long',
      skinTone: 'Clair',
    };

    return { user, profile };
  },

  // Créer un compte marque complet
  createBrandAccount: (): { user: User; profile: BrandProfile } => {
    const userId = 'dev-brand-1';
    const user: User = {
      id: userId,
      email: 'marque@test.com',
      role: 'BRAND',
      name: 'Zara',
      createdAt: new Date(),
    };

    const profile: BrandProfile = {
      userId,
      companyName: 'Zara',
      email: 'marque@test.com',
      website: 'https://www.zara.com',
      city: 'Paris',
      bio: 'Marque de mode internationale recherchant des talents pour ses campagnes publicitaires.',
      logoUrl: 'https://logos-world.net/wp-content/uploads/2020/04/Zara-Logo.png',
      brandType: 'RETAIL_CHAIN',
    };

    return { user, profile };
  },

  // Créer un compte photographe complet
  createPhotographerAccount: (): { user: User; profile: PhotographerProfile } => {
    const userId = 'dev-photographer-1';
    const user: User = {
      id: userId,
      email: 'photographe@test.com',
      role: 'PHOTOGRAPHER',
      name: 'Jean Dupont',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      createdAt: new Date(),
    };

    const profile: PhotographerProfile = {
      userId,
      name: 'Jean Dupont',
      email: 'photographe@test.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      city: 'Paris',
      bio: 'Photographe professionnel spécialisé en mode et portrait. Recherche des modèles pour mes projets créatifs.',
      portfolioImages: getPortfolioImages(),
      specialties: ['FASHION', 'PORTRAIT', 'STUDIO'],
      portfolioLink: 'https://instagram.com/jeandupont',
    };

    return { user, profile };
  },

  // Charger rapidement un compte (crée le compte + profil si nécessaire)
  quickLoadAccount: (role: 'MODEL' | 'BRAND' | 'PHOTOGRAPHER'): void => {
    let user: User;
    let profile: ModelProfile | BrandProfile | PhotographerProfile;
    
    if (role === 'MODEL') {
      const result = devAccounts.createModelAccount();
      user = result.user;
      // Récupérer le profil existant s'il existe pour préserver les modifications
      const existingProfile = userStore.getModelProfile(user.id);
      // Synchroniser avec auth ET userStore
      auth.setCurrentUser(user);
      userStore.setCurrentUser(user);
      // Ne remplacer le profil que s'il n'existe pas déjà, pour préserver les modifications
      if (!existingProfile) {
        userStore.setModelProfile(result.profile);
      }
      // Remettre les crédits du compte modèle rapide à chaque chargement.
      creditsStore.resetCredits(user.id);
      // Sinon, le profil existant est préservé avec toutes ses modifications
    } else if (role === 'BRAND') {
      const result = devAccounts.createBrandAccount();
      user = result.user;
      profile = result.profile;
      // Synchroniser avec auth ET userStore
      auth.setCurrentUser(user);
      userStore.setCurrentUser(user);
      userStore.setBrandProfile(profile as BrandProfile);
    } else if (role === 'PHOTOGRAPHER') {
      const result = devAccounts.createPhotographerAccount();
      user = result.user;
      profile = result.profile;
      // Synchroniser avec auth ET userStore
      auth.setCurrentUser(user);
      userStore.setCurrentUser(user);
      userStore.setPhotographerProfile(profile as PhotographerProfile);
    } else {
      return;
    }
    
    // Déclencher un événement personnalisé pour mettre à jour la navbar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userChanged'));
      // Forcer aussi un événement storage pour les autres listeners
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'modl_user',
        newValue: JSON.stringify(user),
      }));
    }
  },
};
