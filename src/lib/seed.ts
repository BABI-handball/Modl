'use client';

import { User, ModelProfile, BrandProfile, PhotographerProfile, JobPost, Application } from '@/src/types';
import { userStore } from './userStore';
import { jobsStore } from './jobs';
import { applicationsStore } from './applications';
import { messagesStore } from './messagesStore';
import { Thread } from '@/src/types/messaging';

import { getPortfolioImages, PORTFOLIO_IMAGE_URL } from './portfolioImage';

const PORTFOLIO_IMAGES = getPortfolioImages();

/**
 * Seed initial pour le mode démo
 * Crée des données réalistes pour tester l'application
 */
export const seedDemoData = () => {
  if (typeof window === 'undefined') return;

  // Vérifier si les données ont déjà été seedées
  const hasSeeded = localStorage.getItem('modl_seeded');
  if (hasSeeded === 'true') {
    return; // Ne pas re-seeder si déjà fait
  }

  console.log('🌱 Seeding demo data...');

  // 1. Seed des utilisateurs et profils
  const modelUsers: User[] = [
    {
      id: 'model-1',
      email: 'sophie.martin@example.com',
      role: 'MODEL',
      name: 'Sophie Martin',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'model-2',
      email: 'lucas.dupont@example.com',
      role: 'MODEL',
      name: 'Lucas Dupont',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date('2024-01-20'),
    },
    {
      id: 'model-3',
      email: 'emma.bernard@example.com',
      role: 'MODEL',
      name: 'Emma Bernard',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date('2024-02-01'),
    },
    {
      id: 'model-4',
      email: 'thomas.leroy@example.com',
      role: 'MODEL',
      name: 'Thomas Leroy',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date('2024-02-10'),
    },
    {
      id: 'model-5',
      email: 'lea.moreau@example.com',
      role: 'MODEL',
      name: 'Léa Moreau',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      createdAt: new Date('2024-02-15'),
    },
  ];

  const modelProfiles: ModelProfile[] = [
    {
      userId: 'model-1',
      name: 'Sophie Martin',
      age: 24,
      height: 175,
      weight: 58,
      city: 'Paris',
      eyeColor: 'Bleus',
      hairColor: 'Blond',
      bio: 'Mannequin passionnée par la mode et la photographie. Disponible pour divers projets créatifs.',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      portfolioImages: PORTFOLIO_IMAGES,
      tags: ['RUNWAY', 'COMMERCIAL', 'EDITORIAL'],
      experienceYears: 3,
      gender: 'Femme',
      bust: 86,
      waist: 62,
      hips: 90,
      shoeSize: 38,
      dressSize: '36',
      hairLength: 'Long',
      skinTone: 'Clair',
    },
    {
      userId: 'model-2',
      name: 'Lucas Dupont',
      age: 26,
      height: 185,
      weight: 75,
      city: 'Lyon',
      eyeColor: 'Marrons',
      hairColor: 'Brun',
      bio: 'Modèle masculin spécialisé en mode masculine et lifestyle.',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      portfolioImages: PORTFOLIO_IMAGES,
      tags: ['COMMERCIAL', 'FITNESS'],
      experienceYears: 5,
    },
    {
      userId: 'model-3',
      name: 'Emma Bernard',
      age: 22,
      height: 170,
      weight: 55,
      city: 'Marseille',
      eyeColor: 'Verts',
      hairColor: 'Roux',
      bio: 'Jeune mannequin recherchant des opportunités en beauté et éditorial.',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      portfolioImages: PORTFOLIO_IMAGES,
      tags: ['BEAUTY', 'EDITORIAL'],
      experienceYears: 1,
    },
    {
      userId: 'model-4',
      name: 'Thomas Leroy',
      age: 28,
      height: 180,
      weight: 72,
      city: 'Paris',
      eyeColor: 'Bleus',
      hairColor: 'Blond',
      bio: 'Modèle expérimenté pour shootings mode et publicités.',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      portfolioImages: PORTFOLIO_IMAGES,
      tags: ['COMMERCIAL', 'RUNWAY'],
      experienceYears: 7,
    },
    {
      userId: 'model-5',
      name: 'Léa Moreau',
      age: 25,
      height: 172,
      weight: 60,
      city: 'Toulouse',
      eyeColor: 'Marrons',
      hairColor: 'Noir',
      bio: 'Mannequin polyvalente pour e-commerce et éditorial.',
      avatarUrl: PORTFOLIO_IMAGE_URL,
      portfolioImages: PORTFOLIO_IMAGES,
      tags: ['COMMERCIAL', 'E_COMMERCE'],
      experienceYears: 4,
    },
  ];

  const brandUsers: User[] = [
    {
      id: 'brand-1',
      email: 'contact@zara.com',
      role: 'BRAND',
      name: 'Zara',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 'brand-2',
      email: 'info@hm.com',
      role: 'BRAND',
      name: 'H&M',
      createdAt: new Date('2024-01-05'),
    },
    {
      id: 'brand-3',
      email: 'hello@mango.com',
      role: 'BRAND',
      name: 'Mango',
      createdAt: new Date('2024-01-10'),
    },
  ];

  const brandProfiles: BrandProfile[] = [
    {
      userId: 'brand-1',
      companyName: 'Zara',
      website: 'https://www.zara.com',
      city: 'Paris',
      bio: 'Marque de mode internationale recherchant des talents pour ses campagnes.',
      brandType: 'RETAIL_CHAIN',
    },
    {
      userId: 'brand-2',
      companyName: 'H&M',
      website: 'https://www.hm.com',
      city: 'Paris',
      bio: 'Fast fashion suédoise à la recherche de nouveaux visages.',
      brandType: 'RETAIL_CHAIN',
    },
    {
      userId: 'brand-3',
      companyName: 'Mango',
      website: 'https://www.mango.com',
      city: 'Barcelone',
      bio: 'Marque espagnole de prêt-à-porter féminin.',
      brandType: 'RETAIL_CHAIN',
    },
  ];

  const photographerUsers: User[] = [
    {
      id: 'photo-1',
      email: 'jean.dupont@example.com',
      role: 'PHOTOGRAPHER',
      name: 'Jean Dupont',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      createdAt: new Date('2024-01-08'),
    },
    {
      id: 'photo-2',
      email: 'marie.laurent@example.com',
      role: 'PHOTOGRAPHER',
      name: 'Marie Laurent',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      createdAt: new Date('2024-01-12'),
    },
  ];

  const photographerProfiles: PhotographerProfile[] = [
    {
      userId: 'photo-1',
      name: 'Jean Dupont',
      city: 'Paris',
      bio: 'Photographe professionnel spécialisé en mode et portrait.',
      portfolioImages: PORTFOLIO_IMAGES,
      specialties: ['FASHION', 'PORTRAIT'],
      portfolioLink: 'https://instagram.com/jeandupont',
    },
    {
      userId: 'photo-2',
      name: 'Marie Laurent',
      city: 'Lyon',
      bio: 'Photographe de mode et beauté, recherche modèles pour projets créatifs.',
      portfolioImages: PORTFOLIO_IMAGES,
      specialties: ['FASHION', 'PORTRAIT'],
      portfolioLink: 'https://instagram.com/marielaurent',
    },
  ];

  // Sauvegarder les profils dans userStore
  modelProfiles.forEach(profile => {
    userStore.setModelProfile(profile);
  });
  brandProfiles.forEach(profile => {
    userStore.setBrandProfile(profile);
  });
  photographerProfiles.forEach(profile => {
    userStore.setPhotographerProfile(profile);
  });

  // 2. Seed des annonces
  const jobs: JobPost[] = [
    {
      id: 'job-1',
      ownerUserId: 'brand-1',
      ownerRole: 'BRAND',
      title: 'Campagne print été 2024',
      type: 'FASHION',
      location: 'Paris, 75001',
      date: new Date('2024-06-15'),
      duration: '1 jour',
      payAmount: 800,
      payType: 'PAID',
      description: 'Recherche mannequin féminin pour campagne print été 2024. Shooting en extérieur.',
      deliverables: ['Photos haute résolution', 'Rights d\'utilisation'],
      referenceImages: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      ],
      createdAt: new Date('2024-03-01'),
    },
    {
      id: 'job-2',
      ownerUserId: 'photo-1',
      ownerRole: 'PHOTOGRAPHER',
      title: 'Portrait mode éditorial',
      type: 'EDITORIAL',
      location: 'Paris, Studio',
      date: new Date('2024-05-20'),
      duration: '4h',
      payAmount: 300,
      payType: 'PAID',
      description: 'Shooting portrait mode éditorial pour magazine.',
      deliverables: ['Photos retouchées', 'Rights éditoriaux'],
      referenceImages: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
      ],
      createdAt: new Date('2024-03-05'),
    },
    {
      id: 'job-3',
      ownerUserId: 'brand-2',
      ownerRole: 'BRAND',
      title: 'E-commerce lookbook',
      type: 'COMMERCIAL',
      location: 'Paris, Showroom',
      date: new Date('2024-05-10'),
      duration: '1 jour',
      payAmount: 500,
      payType: 'PAID',
      description: 'Shooting e-commerce pour collection printemps.',
      deliverables: ['Photos produit', 'Photos lookbook'],
      referenceImages: [],
      createdAt: new Date('2024-03-10'),
    },
  ];

  jobs.forEach(job => {
    jobsStore.add(job);
  });

  // 3. Seed des candidatures
  const applications: Application[] = [
    {
      id: 'app-1',
      jobId: 'job-1',
      modelUserId: 'model-1',
      message: 'Bonjour, je suis très intéressée par ce projet. J\'ai déjà travaillé sur des campagnes similaires.',
      status: 'PENDING',
      createdAt: new Date('2024-03-02'),
    },
    {
      id: 'app-2',
      jobId: 'job-1',
      modelUserId: 'model-3',
      message: 'Je serais ravie de participer à cette campagne.',
      status: 'SHORTLISTED',
      createdAt: new Date('2024-03-03'),
    },
    {
      id: 'app-3',
      jobId: 'job-2',
      modelUserId: 'model-1',
      message: 'Portrait mode éditorial, c\'est exactement mon domaine.',
      status: 'PENDING',
      createdAt: new Date('2024-03-06'),
    },
    {
      id: 'app-4',
      jobId: 'job-3',
      modelUserId: 'model-5',
      message: 'Expérience en e-commerce, disponible pour ce shooting.',
      status: 'PENDING',
      createdAt: new Date('2024-03-11'),
    },
  ];

  applications.forEach(app => {
    applicationsStore.add(app);
  });

  // 4. Seed des threads de messages
  const threads: Thread[] = [
    {
      id: 'thread-1',
      participantIds: ['brand-1', 'model-3'],
      participantSummaries: [
        {
          id: 'brand-1',
          name: 'Zara',
          role: 'BRAND',
        },
        {
          id: 'model-3',
          name: 'Emma Bernard',
          role: 'MODEL',
          avatarUrl: PORTFOLIO_IMAGE_URL,
        },
      ],
      createdAt: new Date('2024-03-04'),
      updatedAt: new Date('2024-03-05'),
      listingId: 'job-1',
      lastMessage: {
        text: 'Parfait, je vous envoie les détails du shooting.',
        createdAt: new Date('2024-03-05'),
        fromId: 'brand-1',
      },
    },
  ];

  threads.forEach(thread => {
    const threads = JSON.parse(localStorage.getItem('modl_threads_v2') || '[]');
    threads.push(thread);
    localStorage.setItem('modl_threads_v2', JSON.stringify(threads));
  });

  // Marquer comme seedé
  localStorage.setItem('modl_seeded', 'true');
  console.log('✅ Demo data seeded successfully');
};

/**
 * Reset toutes les données de démo
 */
export const resetDemoData = () => {
  if (typeof window === 'undefined') return;

  // Supprimer toutes les clés localStorage sauf celles du currentUser
  const currentUser = localStorage.getItem('modl_user');
  const currentUserProfile = currentUser ? localStorage.getItem(`modl_profile_${JSON.parse(currentUser).id}`) : null;

  localStorage.clear();

  // Restaurer le currentUser si existant
  if (currentUser) {
    localStorage.setItem('modl_user', currentUser);
    if (currentUserProfile) {
      const userId = JSON.parse(currentUser).id;
      localStorage.setItem(`modl_profile_${userId}`, currentUserProfile);
    }
  }

  // Re-seeder
  localStorage.removeItem('modl_seeded');
  seedDemoData();

  console.log('🔄 Demo data reset');
};
