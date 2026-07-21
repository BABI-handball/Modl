// Credits system — localStorage-first, Supabase background sync
// MODEL users get 5 credits/week to unlock PAID job listings
// UNPAID (collaboration) listings are always free

const CREDITS_KEY = 'modl_credits';
const UNLOCKED_KEY = 'modl_unlocked_listings';
const DEFAULT_CREDITS = 5;
const RESET_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

interface CreditsData {
  credits: number;
  lastReset: string; // ISO date
}

function getCreditsData(userId: string): CreditsData {
  if (typeof window === 'undefined') {
    return { credits: DEFAULT_CREDITS, lastReset: new Date().toISOString() };
  }
  const key = `${CREDITS_KEY}_${userId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const data: CreditsData = { credits: DEFAULT_CREDITS, lastReset: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }
  try {
    return JSON.parse(stored) as CreditsData;
  } catch {
    return { credits: DEFAULT_CREDITS, lastReset: new Date().toISOString() };
  }
}

function saveCreditsData(userId: string, data: CreditsData) {
  if (typeof window === 'undefined') return;
  const key = `${CREDITS_KEY}_${userId}`;
  localStorage.setItem(key, JSON.stringify(data));
}

function getUnlockedListings(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const key = `${UNLOCKED_KEY}_${userId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

function saveUnlockedListings(userId: string, listings: string[]) {
  if (typeof window === 'undefined') return;
  const key = `${UNLOCKED_KEY}_${userId}`;
  localStorage.setItem(key, JSON.stringify(listings));
}

function checkAndResetIfNeeded(userId: string): CreditsData {
  const data = getCreditsData(userId);
  const lastReset = new Date(data.lastReset).getTime();
  if (Date.now() - lastReset >= RESET_INTERVAL_MS) {
    const newData: CreditsData = {
      credits: DEFAULT_CREDITS,
      lastReset: new Date().toISOString(),
    };
    saveCreditsData(userId, newData);
    return newData;
  }
  return data;
}

export const creditsStore = {
  /** Retourne le nombre de credits restants (apres reset si necessaire) */
  getCredits(userId: string): number {
    const data = checkAndResetIfNeeded(userId);
    return data.credits;
  },

  /** Verifie si une annonce est deja debloquee */
  isUnlocked(userId: string, listingId: string): boolean {
    return getUnlockedListings(userId).includes(listingId);
  },

  /** Verifie si l'utilisateur peut debloquer (a au moins 1 credit) */
  canUnlock(userId: string): boolean {
    return this.getCredits(userId) > 0;
  },

  /**
   * Debloque une annonce en consommant 1 credit.
   * Retourne true si reussi, false si pas assez de credits.
   */
  unlockListing(userId: string, listingId: string): boolean {
    // Deja debloquee = gratuit
    if (this.isUnlocked(userId, listingId)) return true;

    const data = checkAndResetIfNeeded(userId);
    if (data.credits <= 0) return false;

    // Deduire 1 credit
    data.credits = Math.max(0, data.credits - 1);
    saveCreditsData(userId, data);

    // Enregistrer le deblocage
    const unlocked = getUnlockedListings(userId);
    unlocked.push(listingId);
    saveUnlockedListings(userId, unlocked);

    return true;
  },

  /** Retourne la liste des IDs d'annonces debloquees */
  getUnlockedListings(userId: string): string[] {
    return getUnlockedListings(userId);
  },

  /**
   * Temps (en ms) avant le prochain reset des credits.
   * 0 si le reset est imminent.
   */
  getTimeUntilReset(userId: string): number {
    const data = getCreditsData(userId);
    const lastReset = new Date(data.lastReset).getTime();
    return Math.max(0, RESET_INTERVAL_MS - (Date.now() - lastReset));
  },

  /** Formate le temps restant avant reset en texte lisible */
  formatTimeUntilReset(userId: string): string {
    const ms = this.getTimeUntilReset(userId);
    if (ms === 0) return 'bientot';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `dans ${days}j`;
    if (hours > 0) return `dans ${hours}h`;
    const mins = Math.floor((ms % (60 * 60 * 1000)) / 60000);
    return `dans ${mins}min`;
  },

  /** Réinitialise les crédits d'un utilisateur à la valeur par défaut. */
  resetCredits(userId: string): void {
    const data: CreditsData = {
      credits: DEFAULT_CREDITS,
      lastReset: new Date().toISOString(),
    };
    saveCreditsData(userId, data);
  },
};
