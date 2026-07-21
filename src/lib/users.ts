import { User, UserRole } from '@/src/types';

const USERS_STORAGE_KEY = 'modl_users';

interface UserAccount {
  id: string;
  email: string;
  password: string; // En production, devrait être hashé
  role: UserRole;
  createdAt: Date;
}

// Helper pour charger les utilisateurs depuis localStorage
const getUsers = (): UserAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) {
      const users = JSON.parse(stored);
      // Convertir les dates string en Date objects
      return users.map((u: any) => ({
        ...u,
        createdAt: new Date(u.createdAt),
      }));
    }
    return [];
  } catch {
    return [];
  }
};

// Helper pour sauvegarder les utilisateurs
const saveUsers = (users: UserAccount[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

export const usersStore = {
  // Créer un nouvel utilisateur (inscription)
  createUser: (email: string, password: string, role: UserRole = 'MODEL'): { success: boolean; error?: string; user?: User } => {
    const users = getUsers();
    
    // Vérifier si l'email existe déjà
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Cet email est déjà utilisé' };
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    // Créer le nouvel utilisateur
    const newUser: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      password, // En production, hasher le mot de passe
      role,
      createdAt: new Date(),
    };

    users.push(newUser);
    saveUsers(users);

    // Retourner l'utilisateur sans le mot de passe
    const user: User = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return { success: true, user };
  },

  // Authentifier un utilisateur (connexion)
  authenticate: (email: string, password: string): { success: boolean; error?: string; user?: User } => {
    const users = getUsers();
    const userAccount = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userAccount) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    if (userAccount.password !== password) {
      return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    // Retourner l'utilisateur sans le mot de passe
    const user: User = {
      id: userAccount.id,
      email: userAccount.email,
      role: userAccount.role,
      createdAt: userAccount.createdAt,
    };

    return { success: true, user };
  },

  // Vérifier si un email existe déjà
  emailExists: (email: string): boolean => {
    const users = getUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  },
};
