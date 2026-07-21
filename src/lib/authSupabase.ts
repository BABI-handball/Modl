/**
 * Authentification avec Supabase
 * Remplace progressivement src/lib/auth.ts
 */

import { createClient } from './supabase/client';
import { User, UserRole } from '@/src/types';

function toReadableAuthError(error: unknown): string {
  const fallback = 'Erreur réseau. Vérifiez votre connexion ou la configuration Supabase.';
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('failed to fetch')) {
      return 'Connexion à Supabase impossible (Failed to fetch). Vérifiez NEXT_PUBLIC_SUPABASE_URL, la clé anonyme et votre réseau.';
    }
    return error.message || fallback;
  }
  return fallback;
}

/** Mappe une ligne `public.users` (snake_case) vers le type applicatif `User`. */
function userFromRow(row: {
  id: string;
  email?: string | null;
  role: string;
  created_at?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  credits?: number | null;
  last_credit_reset?: string | null;
  listings_posted?: number | null;
  listings_reset_date?: string | null;
  listing_credits?: number | null;
}): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    role: row.role as UserRole,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    name: row.name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    credits: row.credits ?? undefined,
    lastCreditReset: row.last_credit_reset ?? undefined,
    listingsPosted: row.listings_posted ?? undefined,
    listingsResetDate: row.listings_reset_date ?? undefined,
    listingCredits: row.listing_credits ?? undefined,
  };
}

export const authSupabase = {
  /**
   * Connexion avec email/password
   */
  signIn: async (email: string, password: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Message d'erreur plus explicite pour la confirmation email
        if (error.message.includes('email not confirmed') || error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception (et les spams).' 
          };
        }
        // Message pour les identifiants invalides
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid')) {
          return { 
            success: false, 
            error: 'Email ou mot de passe incorrect. Si vous venez de créer votre compte, vérifiez votre email pour confirmer votre compte.' 
          };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Erreur de connexion' };
      }

      // Verrou applicatif: empêcher l'accès si l'email n'est pas confirmé.
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception (et les spams).',
        };
      }

      // Récupérer les données utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return { success: false, error: 'Profil utilisateur introuvable' };
      }

      const user = userFromRow(userData);

      return { success: true, user };
    } catch (error) {
      return { success: false, error: toReadableAuthError(error) };
    }
  },

  /**
   * Inscription avec email/password
   */
  signUp: async (email: string, password: string, role: UserRole, emailRedirectTo?: string) => {
    try {
      const supabase = createClient();
      
      // Créer l'utilisateur dans auth.users
      // Le trigger SQL créera automatiquement l'entrée dans la table users
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      });

      if (authError) {
        // Message d'erreur plus explicite pour le rate limit
        if (authError.message.includes('rate limit')) {
          return { 
            success: false, 
            error: 'Trop de tentatives. Veuillez attendre quelques minutes ou utiliser un autre email.' 
          };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Erreur lors de la création du compte' };
      }

    /**
     * IMPORTANT :
     * - Quand la confirmation d'email est OBLIGATOIRE, Supabase ne crée PAS de session immédiatement.
     * - Dans ce cas, il n'y a PAS de auth.uid() côté RLS, donc toute tentative d'INSERT/SELECT direct
     *   sur la table public.users depuis le client viole les politiques RLS.
     * - On laisse donc le trigger côté base créer la ligne dans public.users, et on ne touche pas à la table ici.
     */
      if (!authData.session) {
        console.warn(
          'Inscription avec confirmation email requise : aucune session créée immédiatement. ' +
          'Le trigger en base créera l’entrée dans public.users après confirmation.'
        );

        const user: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          // On stocke le rôle souhaité localement ; la table users sera mise à jour par le trigger / un process serveur
          role,
          createdAt: new Date(),
        };

        return { success: true, user, requiresEmailConfirmation: true };
      }

    // À partir d’ici, on a une session => auth.uid() disponible pour les politiques RLS sur public.users.
    // On laisse un petit délai pour que le trigger ait le temps de créer la ligne.
      await new Promise(resolve => setTimeout(resolve, 2000));

    // Récupérer l'utilisateur créé par le trigger
      let { data: userDataArray, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .limit(1);

      let userData = userDataArray && userDataArray.length > 0 ? userDataArray[0] : null;

    // Si le trigger n'a pas créé l'entrée, créer manuellement
      if (!userData) {
        console.warn('Trigger n\'a pas créé l\'entrée, création manuelle...');
        
        const { data: insertedData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email,
            role: role,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erreur lors de la création manuelle du profil:', insertError);
          return { 
            success: false, 
            error: `Erreur lors de la création du profil: ${insertError.message}. Vérifiez les politiques RLS dans Supabase.` 
          };
        }

        userData = insertedData;
      }

    // Mettre à jour le rôle si nécessaire (le trigger crée avec MODEL par défaut)
      if (userData.role !== role) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: role })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour du rôle:', updateError);
        }
      }

      const user = userFromRow({
        ...userData,
        role: userData.role || role,
      });

      return { success: true, user, requiresEmailConfirmation: false };
    } catch (error) {
      return { success: false, error: toReadableAuthError(error) };
    }
  },

  /**
   * Récupérer l'utilisateur actuel
   * Optimisé pour utiliser la session directement (plus rapide)
   */
  getCurrentUser: async (): Promise<User | null> => {
    const supabase = createClient();
    
    // Utiliser getSession() au lieu de getUser() - plus rapide car utilise le cache
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    // Récupérer les données depuis la table users (avec timeout pour éviter les blocages)
    const userDataPromise = supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Timeout un peu plus large pour réduire les faux fallback de rôle.
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 1500);
    });

    const result = await Promise.race([
      userDataPromise.then(({ data, error }) => ({ data, error })),
      timeoutPromise.then(() => ({ data: null, error: { message: 'timeout' } }))
    ]);

    if (result.error || !result.data) {
      // Si erreur/timeout, garder en priorité le rôle déjà connu localement
      // pour éviter de masquer des sections UI (ex: Publier/Candidatures).
      let fallbackRole: UserRole = 'MODEL';
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('modl_user');
          if (raw) {
            const localUser = JSON.parse(raw) as { id?: string; role?: UserRole };
            if (localUser.id === session.user.id && localUser.role) {
              fallbackRole = localUser.role;
            }
          }
        } catch {
          // no-op
        }
      }

      // Retourner l'utilisateur basique depuis la session en conservant le rôle local.
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: fallbackRole,
        createdAt: new Date(),
      };
    }

    return userFromRow(result.data);
  },

  /**
   * Déconnexion
   */
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: async (): Promise<boolean> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  },

  /**
   * Réinitialiser le mot de passe avec un token
   */
  resetPassword: async (accessToken: string, newPassword: string) => {
    const supabase = createClient();
    
    // Définir la session avec le token de réinitialisation
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // Pas nécessaire pour la réinitialisation
    });

    if (sessionError) {
      return { 
        success: false, 
        error: 'Token de réinitialisation invalide ou expiré.' 
      };
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { 
        success: false, 
        error: updateError.message || 'Erreur lors de la mise à jour du mot de passe.' 
      };
    }

    return { success: true };
  },

  /**
   * Demander une réinitialisation de mot de passe (envoie un email)
   */
  requestPasswordReset: async (email: string) => {
    const supabase = createClient();
    
    // Récupérer l'URL de redirection depuis les variables d'environnement ou utiliser une valeur par défaut
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/reset-password`
      : 'http://localhost:3000/auth/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { 
        success: false, 
        error: error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.' 
      };
    }

    return { success: true };
  },
};
