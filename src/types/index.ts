export type UserRole = 'MODEL' | 'BRAND' | 'PHOTOGRAPHER';

export interface User {
  id: string;
  email?: string;
  role: UserRole;
  createdAt: Date;
  name?: string; // Nom commun pour tous les rôles
  avatarUrl?: string; // Avatar commun
  credits?: number; // Credits pour debloquer les annonces payantes (MODEL uniquement)
  lastCreditReset?: string; // ISO date du dernier reset mensuel (MODEL)
  listingsPosted?: number; // Nb d'annonces postees ce mois (BRAND/PHOTOGRAPHER)
  listingsResetDate?: string; // ISO date du dernier reset mensuel du quota
  listingCredits?: number; // Credits supplementaires achetes (BRAND/PHOTOGRAPHER)
}

export type ModelTag = 'RUNWAY' | 'COMMERCIAL' | 'EDITORIAL' | 'FITNESS' | 'BEAUTY' | 'LIFESTYLE' | 'E_COMMERCE';
export type PhotographerSpecialty = 'PORTRAIT' | 'FASHION' | 'STUDIO' | 'OUTDOOR' | 'WEDDING' | 'EVENT' | 'PRODUCT';
export type BrandType = 'INDEPENDENT' | 'E_COMMERCE' | 'AGENCY' | 'RETAIL_CHAIN' | 'MEDIA' | 'OTHER';
export type CreativeType = 'PHOTOGRAPHER' | 'ART_DIRECTOR' | 'MAKEUP_ARTIST' | 'VIDEO_FIGURATION' | 'STYLIST' | 'OTHER';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NONE';

export interface ModelProfile {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  age?: number;
  height?: number; // en cm
  weight?: number; // en kg
  city: string;
  eyeColor?: string;
  hairColor?: string;
  bio: string;
  portfolioImages: string[]; // Au moins 1 obligatoire
  tags?: ModelTag[];
  experienceYears?: number; // 0-20
  gender?: string;
  measurements?: string; // Optionnel (ancien format)
  // Mensurations détaillées
  bust?: number; // Tour de poitrine en cm
  waist?: number; // Tour de taille en cm
  hips?: number; // Tour de hanches en cm
  shoeSize?: number; // Pointure européenne
  dressSize?: string; // Taille de vêtement (ex: 36, 38, S, M, L)
  armCircumference?: number; // Tour de bras en cm
  hairLength?: string; // Longueur des cheveux (Court, Mi-long, Long)
  skinTone?: string; // Teint de peau
  verified?: boolean; // Statut de vérification
  verificationStatus?: VerificationStatus; // Statut de la demande de vérification
  verificationPhotos?: string[]; // Photos avec pièce d'identité
}

export interface BrandProfile {
  userId: string;
  companyName: string;
  email?: string;
  website?: string;
  city: string;
  bio: string;
  logoUrl?: string;
  brandType?: BrandType;
}

export interface PhotographerProfile {
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  city: string;
  bio: string;
  portfolioImages: string[];
  specialties?: PhotographerSpecialty[];
  portfolioLink?: string; // Site web / Instagram
  equipment?: string; // Optionnel
  style?: string; // Optionnel
  creativeType?: CreativeType; // Type de créatif (photographe, directeur artistique, etc.)
}

export type JobType = 'FASHION' | 'BEAUTY' | 'COMMERCIAL' | 'EDITORIAL' | 'EVENT' | 'OTHER';
export type PayType = 'PAID' | 'UNPAID';

export interface JobPost {
  id: string;
  ownerUserId: string;
  ownerRole: 'BRAND' | 'PHOTOGRAPHER';
  title: string;
  type: JobType;
  location: string;
  date: Date;
  duration: string; // ex: "4h", "1 jour"
  payAmount: number | null;
  payType: PayType;
  description: string;
  deliverables: string[];
  referenceImages: string[];
  createdAt: Date;
  isExpressCasting?: boolean; // Casting urgent (moins de 3 jours)
  isBoosted?: boolean; // Annonce sponsorisée
  boostUntil?: Date; // Date de fin du boost
}

export type ApplicationStatus = 'PENDING' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';

export interface Application {
  id: string;
  jobId: string;
  modelUserId: string;
  message?: string; // Message optionnel
  status: ApplicationStatus;
  createdAt: Date;
  selectedAt?: Date; // Date de sélection (quand swipé right)
}

// Évaluation d'un modèle après un shooting
export interface ModelReview {
  id: string;
  modelUserId: string; // ID du modèle évalué
  reviewerUserId: string; // ID de la marque/photographe qui évalue
  jobId: string; // ID de l'annonce concernée
  applicationId: string; // ID de la candidature
  // Critères d'évaluation (notes sur 5)
  professionalism: number; // Professionnalisme général
  punctuality: number; // Ponctualité
  communication: number; // Communication
  appearance: number; // Apparence conforme aux mensurations
  attitude: number; // Attitude sur le plateau
  // Note globale (moyenne)
  overallRating: number;
  // Commentaire optionnel
  comment?: string;
  createdAt: Date;
}

// Extension du ModelProfile pour inclure les évaluations
export interface ModelStats {
  totalReviews: number;
  averageRating: number;
  professionalismAvg: number;
  punctualityAvg: number;
  communicationAvg: number;
  appearanceAvg: number;
  attitudeAvg: number;
}
