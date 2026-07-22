'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/src/lib/auth';
import { authSupabase } from '@/src/lib/authSupabase';
import { User, UserRole } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { devAccounts } from '@/src/lib/devAccounts';
import { userStore } from '@/src/lib/userStore';
import { usersStore } from '@/src/lib/users';
import { userProfilesSupabase } from '@/src/lib/userProfilesSupabase';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingView, setIsSwitchingView] = useState(false);
  const [confirmEmailRedirect, setConfirmEmailRedirect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setConfirmEmailRedirect(params.get('confirmEmail') === '1');
  }, []);

  const handleToggleAuthView = () => {
    setIsSwitchingView(true);
    setTimeout(() => {
      setIsLogin((prev) => !prev);
      setError('');
      setPassword('');
      setConfirmPassword('');
      setIsAdultConfirmed(false);
      setLegalAccepted(false);
      setTimeout(() => setIsSwitchingView(false), 40);
    }, 140);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Connexion avec Supabase
        const result = await authSupabase.signIn(email, password);
        
        if (!result.success) {
          setError(result.error || 'Erreur de connexion');
          setIsLoading(false);
          return;
        }

        if (result.user) {
          console.log('🔐 Connexion réussie:', {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          });
          
          // Synchroniser avec le système local pour compatibilité
          auth.setCurrentUser(result.user);
          userStore.setCurrentUser(result.user);
          
          // Charger le profil depuis Supabase AVANT de rediriger
          // Attendre que le profil soit chargé pour éviter la redirection vers onboarding
          let profileLoaded = false;
          
          const loadProfile = async () => {
            try {
              // Charger selon le rôle actuel puis fallback multi-rôles
              if (result.user.role === 'BRAND') {
                const profile = await userProfilesSupabase.getBrandProfile(result.user.id);
                if (profile) {
                  userStore.setBrandProfile(profile);
                  profileLoaded = true;
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId: result.user.id, role: 'BRAND' } }));
                  }
                  return;
                }
              } else if (result.user.role === 'PHOTOGRAPHER') {
                const profile = await userProfilesSupabase.getPhotographerProfile(result.user.id);
                if (profile) {
                  userStore.setPhotographerProfile(profile);
                  profileLoaded = true;
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId: result.user.id, role: 'PHOTOGRAPHER' } }));
                  }
                  return;
                }
              } else if (result.user.role === 'MODEL') {
                const profile = await userProfilesSupabase.getModelProfile(result.user.id);
                if (profile) {
                  userStore.setModelProfile(profile);
                  profileLoaded = true;
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId: result.user.id, role: 'MODEL' } }));
                  }
                  return;
                }
              }

              // Fallback: rôle désynchronisé en DB, on tente les 3 profils et on corrige localement.
              const [modelProfile, photographerProfile, brandProfile] = await Promise.all([
                userProfilesSupabase.getModelProfile(result.user.id),
                userProfilesSupabase.getPhotographerProfile(result.user.id),
                userProfilesSupabase.getBrandProfile(result.user.id),
              ]);

              if (modelProfile) {
                userStore.setModelProfile(modelProfile);
                profileLoaded = true;
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId: result.user.id, role: 'MODEL' } }));
                }
                return;
              }
              if (photographerProfile) {
                userStore.setPhotographerProfile(photographerProfile);
                profileLoaded = true;
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId: result.user.id, role: 'PHOTOGRAPHER' } }));
                }
                return;
              }
              if (brandProfile) {
                userStore.setBrandProfile(brandProfile);
                profileLoaded = true;
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('profileLoaded', { detail: { userId: result.user.id, role: 'BRAND' } }));
                }
                return;
              }

              profileLoaded = true;
            } catch (error) {
              console.error('❌ Erreur lors du chargement du profil:', error);
              profileLoaded = true; // Marquer comme chargé même en cas d'erreur
            }
          };
          
          // Charger le profil et attendre un peu avant de rediriger
          loadProfile().then(() => {
            // Attendre un peu pour que le profil soit bien sauvegardé dans localStorage
            setTimeout(() => {
              // Rediriger selon le rôle
              if (result.user.role === 'BRAND' || result.user.role === 'PHOTOGRAPHER') {
                router.replace('/jobs');
              } else if (result.user.role === 'MODEL') {
                router.replace('/jobs');
              } else {
                router.replace('/onboarding');
              }
            }, 300);
          });
        }
      } else {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          setIsLoading(false);
          return;
        }
        if (!isAdultConfirmed) {
          setError('Vous devez certifier avoir plus de 18 ans pour créer un compte modèle.');
          setIsLoading(false);
          return;
        }
        if (!legalAccepted) {
          setError('Vous devez accepter les mentions légales, la politique de confidentialité et les conditions générales.');
          setIsLoading(false);
          return;
        }

        // Inscription avec Supabase (par défaut MODEL, le rôle sera défini à l'onboarding)
        const emailRedirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/confirm-email`
            : undefined;
        const result = await authSupabase.signUp(email, password, 'MODEL', emailRedirectTo);
        
        if (!result.success) {
          setError(result.error || 'Erreur lors de l\'inscription');
          setIsLoading(false);
          return;
        }

        if (result.requiresEmailConfirmation) {
          // Ne PAS connecter localement l'utilisateur si l'email n'est pas confirmé.
          // Sinon il peut accéder à l'app sans validation.
          auth.logout();
          userStore.logout();
          setPassword('');
          setConfirmPassword('');
          router.replace(`/auth/verify-email?email=${encodeURIComponent(email)}`);
          setIsLoading(false);
          return;
        }

        if (result.user) {
          // Synchroniser avec le système local pour compatibilité
          auth.setCurrentUser(result.user);
          userStore.setCurrentUser(result.user);
          
          // Rediriger vers l'onboarding pour compléter le profil
          router.replace('/onboarding');
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite');
      console.error('Erreur auth:', err);
    } finally {
      // Toujours débloquer le bouton, même si une branche n'a pas reset l'état.
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = (role: 'MODEL' | 'BRAND' | 'PHOTOGRAPHER') => {
    devAccounts.quickLoadAccount(role);
    // Récupérer l'utilisateur après le chargement
    const currentUser = userStore.getCurrentUser();
    if (currentUser) {
      // Rediriger selon le rôle
      if (currentUser.role === 'BRAND' || currentUser.role === 'PHOTOGRAPHER') {
        router.push('/jobs');
      } else if (currentUser.role === 'MODEL') {
        router.push('/jobs');
      } else {
        router.push('/onboarding');
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-3 py-3 animate-fade-in">
      {/* Image de fond */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/auth-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%',
        }}
      />
      {/* Overlay beige léger pour la lisibilité */}
      <div className="absolute inset-0 z-10 bg-beige-50/48" />
        
      {/* Quick Switch - visible uniquement en développement local */}
      {process.env.NODE_ENV === 'development' && (
      <div className="absolute top-2 right-2 z-30 hidden md:block">
        <Card className="group p-1.5 sm:p-2 shadow-lg max-w-[140px] sm:max-w-[160px]">
          <CardHeader className="pb-1 px-1.5 sm:px-2 pt-0.5 sm:pt-1">
            <CardTitle className="text-[10px] sm:text-xs font-semibold text-neutral-700">⚡ Accès rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 sm:space-y-1 p-0 px-1.5 sm:px-2 pb-1.5 sm:pb-2">
            <Button
              onClick={() => handleQuickSwitch('MODEL')}
              className="w-full justify-start px-1.5 sm:px-2 py-1 sm:py-1.5 h-auto text-[10px] sm:text-xs"
              size="sm"
              variant="outline"
            >
              <span className="text-[10px] sm:text-xs mr-1">👤</span>
              <span className="text-[10px] sm:text-xs">Modèle</span>
            </Button>
            <Button
              onClick={() => handleQuickSwitch('BRAND')}
              className="w-full justify-start px-1.5 sm:px-2 py-1 sm:py-1.5 h-auto text-[10px] sm:text-xs"
              size="sm"
              variant="outline"
            >
              <span className="text-[10px] sm:text-xs mr-1">🏢</span>
              <span className="text-[10px] sm:text-xs">Marque</span>
            </Button>
            <Button
              onClick={() => handleQuickSwitch('PHOTOGRAPHER')}
              className="w-full justify-start px-1.5 sm:px-2 py-1 sm:py-1.5 h-auto text-[10px] sm:text-xs"
              size="sm"
              variant="outline"
            >
              <span className="text-[10px] sm:text-xs mr-1">📷</span>
              <span className="text-[10px] sm:text-xs">Photo</span>
            </Button>
          </CardContent>
        </Card>
      </div>
      )}
      
      <div
        className={`relative z-20 flex w-full max-w-md flex-col items-center justify-center space-y-1.5 sm:space-y-2 transition-all duration-500 ease-out ${
          isLogin ? '-translate-y-4 sm:-translate-y-6' : 'translate-y-2'
        }`}
      >
        {/* Logo MODL */}
        <div
          className={`flex justify-center overflow-hidden transition-all duration-500 ease-out ${
            isLogin ? 'max-h-40 opacity-100 mb-0' : 'max-h-0 opacity-0 -mb-2'
          }`}
          aria-hidden={!isLogin}
        >
          <Link href="/" className="cursor-pointer transition-opacity duration-300 hover:opacity-80">
            <img 
              src="/logo-modl.png" 
              alt="MODL" 
              className="-translate-y-24 sm:-translate-y-28 h-40 w-40 sm:h-52 sm:w-52 md:h-64 md:w-64 lg:h-80 lg:w-80 object-contain"
            />
          </Link>
        </div>

        {/* Formulaire classique */}
        <Card className="group w-full backdrop-blur-md bg-white/42 border-beige-300/40 shadow-lg">
          <div
            className={`transition-all duration-300 ease-out ${
              isSwitchingView ? 'opacity-0 translate-y-1 scale-[0.995]' : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <CardHeader className="text-center pb-1.5 pt-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                {isLogin ? 'Connexion' : 'Inscription'}
              </CardTitle>
              <p className="mt-1 text-sm sm:text-base text-neutral-600">
                {isLogin ? 'Bienvenue sur MODL' : 'Créez votre compte MODL'}
              </p>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Email</label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Mot de passe</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isLogin ? "Votre mot de passe" : "Au moins 6 caractères"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-800 transition-colors"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.042-3.368m2.093-1.867A9.954 9.954 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.976 9.976 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 9L3 3" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {!isLogin && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-neutral-700">Confirmation du mot de passe</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-800 transition-colors"
                        aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.042-3.368m2.093-1.867A9.954 9.954 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.976 9.976 0 01-4.132 5.411M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 9L3 3" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="group flex items-start gap-3 rounded-2xl border border-beige-200/90 bg-gradient-to-br from-white/90 via-beige-50/40 to-white/90 px-4 py-3 text-sm text-neutral-700 shadow-sm transition-all duration-200 hover:border-beige-300 hover:shadow-md">
                      <input
                        type="checkbox"
                        checked={isAdultConfirmed}
                        onChange={(e) => setIsAdultConfirmed(e.target.checked)}
                        className="mt-0.5 h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-beige-300 bg-white checked:border-beige-600 checked:bg-beige-600 focus:ring-2 focus:ring-beige-400/40"
                        required
                      />
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <span className="leading-snug">
                          Je certifie avoir <strong>18 ans ou plus</strong> pour créer un compte modèle.
                        </span>
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-beige-100 text-beige-700 transition-colors group-hover:bg-beige-200">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </label>

                    <label className="group flex items-start gap-3 rounded-2xl border border-beige-200/90 bg-gradient-to-br from-white/90 via-beige-50/40 to-white/90 px-4 py-3 text-sm text-neutral-700 shadow-sm transition-all duration-200 hover:border-beige-300 hover:shadow-md">
                      <input
                        type="checkbox"
                        checked={legalAccepted}
                        onChange={(e) => setLegalAccepted(e.target.checked)}
                        className="mt-0.5 h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-beige-300 bg-white checked:border-beige-600 checked:bg-beige-600 focus:ring-2 focus:ring-beige-400/40"
                        required
                      />
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <span className="leading-snug">
                          J&apos;accepte les{' '}
                          <Link href="/legal/mentions-legales" target="_blank" className="font-semibold underline decoration-beige-500/70 underline-offset-2 hover:text-neutral-900">
                            mentions légales
                          </Link>
                          , la{' '}
                          <Link href="/legal/politique-de-confidentialite" target="_blank" className="font-semibold underline decoration-beige-500/70 underline-offset-2 hover:text-neutral-900">
                            politique de confidentialité
                          </Link>{' '}
                          et les{' '}
                          <Link href="/legal/conditions-generales" target="_blank" className="font-semibold underline decoration-beige-500/70 underline-offset-2 hover:text-neutral-900">
                            conditions générales
                          </Link>
                          .
                        </span>
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-beige-100 text-beige-700 transition-colors group-hover:bg-beige-200">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </label>
                  </div>
                )}
                {(error || confirmEmailRedirect) && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700 animate-fade-in">
                    {error || 'Veuillez confirmer votre email avant d’accéder à la plateforme. Vérifiez votre boîte de réception (et vos spams).'}
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="md" 
                  variant="beige"
                  disabled={isLoading}
                >
                  {isLoading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
                </Button>
              </form>
              <div className="mt-3 text-center space-y-2">
                <button
                  type="button"
                  onClick={handleToggleAuthView}
                  className="text-xs font-semibold text-black hover:text-neutral-700 transition-colors duration-300"
                >
                  {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
                </button>
                {isLogin && (
                  <div>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors duration-300"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
