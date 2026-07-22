// Quota d'annonces pour les BRAND / PHOTOGRAPHER — localStorage-first
// Règle : 3 annonces gratuites par mois + listing_credits achetes supplementaires
// Reset automatique si 30 jours ecoules depuis listings_reset_date
// Pendant la beta : annonces illimitées

import { IS_BETA } from '@/src/lib/beta';

const QUOTA_KEY = 'modl_listing_quota';
const FREE_PER_MONTH = 3;
/** Valeur affichée en beta pour simuler l'illimité */
export const BETA_UNLIMITED_LISTINGS = 999;
const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

interface QuotaData {
  listingsPosted: number;   // nb d'annonces postees ce mois
  listingCredits: number;   // credits supplementaires achetes
  resetDate: string;        // ISO date du dernier reset
}

function getKey(userId: string) {
  return `${QUOTA_KEY}_${userId}`;
}

function loadQuota(userId: string): QuotaData {
  if (typeof window === 'undefined') {
    return { listingsPosted: 0, listingCredits: 0, resetDate: new Date().toISOString() };
  }
  const raw = localStorage.getItem(getKey(userId));
  if (!raw) {
    const initial: QuotaData = {
      listingsPosted: 0,
      listingCredits: 0,
      resetDate: new Date().toISOString(),
    };
    localStorage.setItem(getKey(userId), JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as QuotaData;
  } catch {
    return { listingsPosted: 0, listingCredits: 0, resetDate: new Date().toISOString() };
  }
}

function saveQuota(userId: string, data: QuotaData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getKey(userId), JSON.stringify(data));
}

function checkAndReset(userId: string): QuotaData {
  const data = loadQuota(userId);
  const elapsed = Date.now() - new Date(data.resetDate).getTime();
  if (elapsed >= RESET_INTERVAL_MS) {
    // Reset mensuel : on remet listingsPosted a 0, les credits restes sont conserves
    const reset: QuotaData = {
      listingsPosted: 0,
      listingCredits: data.listingCredits, // les credits achetes survivent au reset
      resetDate: new Date().toISOString(),
    };
    saveQuota(userId, reset);
    return reset;
  }
  return data;
}

export const listingQuota = {
  /** Quota complet apres eventuel reset mensuel */
  getQuota(userId: string): QuotaData {
    return checkAndReset(userId);
  },

  /** Nombre total d'annonces autorisees ce mois (1 gratuite + credits achetes) */
  totalAllowed(userId: string): number {
    if (IS_BETA) return BETA_UNLIMITED_LISTINGS;
    const { listingCredits } = checkAndReset(userId);
    return FREE_PER_MONTH + listingCredits;
  },

  /** Nombre d'annonces restantes ce mois */
  remaining(userId: string): number {
    if (IS_BETA) return BETA_UNLIMITED_LISTINGS;
    const data = checkAndReset(userId);
    return Math.max(0, FREE_PER_MONTH + data.listingCredits - data.listingsPosted);
  },

  /** L'utilisateur peut-il encore poster ? */
  canPost(userId: string): boolean {
    if (IS_BETA) return true;
    return this.remaining(userId) > 0;
  },

  /**
   * Enregistre une publication.
   * A appeler APRES la sauvegarde reussie de l'annonce.
   * Retourne false si la limite etait deja atteinte (securite double).
   */
  recordPost(userId: string): boolean {
    if (IS_BETA) {
      const data = checkAndReset(userId);
      data.listingsPosted += 1;
      saveQuota(userId, data);
      return true;
    }
    const data = checkAndReset(userId);
    if (data.listingsPosted >= FREE_PER_MONTH + data.listingCredits) {
      return false;
    }
    data.listingsPosted += 1;
    saveQuota(userId, data);
    return true;
  },

  /**
   * Ajoute des credits achetes.
   * A appeler apres confirmation de paiement.
   */
  addCredits(userId: string, amount: number) {
    const data = checkAndReset(userId);
    data.listingCredits += amount;
    saveQuota(userId, data);
  },

  /** Temps restant avant le prochain reset (en ms) */
  msUntilReset(userId: string): number {
    const data = loadQuota(userId);
    const elapsed = Date.now() - new Date(data.resetDate).getTime();
    return Math.max(0, RESET_INTERVAL_MS - elapsed);
  },

  /** Texte lisible du temps avant reset */
  labelUntilReset(userId: string): string {
    const ms = this.msUntilReset(userId);
    if (ms === 0) return 'bientot';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `dans ${days}j`;
    if (hours > 0) return `dans ${hours}h`;
    return `dans moins d'1h`;
  },
};
