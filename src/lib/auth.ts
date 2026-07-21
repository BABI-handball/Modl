import { User, UserRole } from '@/src/types';

// Mock auth - en production, remplacer par Supabase
let currentUser: User | null = null;

export const auth = {
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    // Essayer d'abord la clé de userStore pour synchronisation
    const stored = localStorage.getItem('modl_user');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        return currentUser;
      } catch {
        return null;
      }
    }
    return null;
  },

  setCurrentUser: (user: User): void => {
    currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('modl_user', JSON.stringify(user));
    }
  },

  logout: (): void => {
    currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('modl_user');
    }
  },

  requireAuth: (): User => {
    const user = auth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    return user;
  },

  requireRole: (role: UserRole): User => {
    const user = auth.requireAuth();
    if (user.role !== role) {
      throw new Error(`Requires role: ${role}`);
    }
    return user;
  },
};
