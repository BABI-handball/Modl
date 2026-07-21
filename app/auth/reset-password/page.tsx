'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/src/lib/supabase/client';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    const initializeRecoverySession = async () => {
      try {
        const supabase = createClient();
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // Cas moderne Supabase (PKCE): ?code=...
        const code = queryParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError('Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien.');
          }
          setIsValidatingToken(false);
          return;
        }

        // Cas hash: #access_token=...&refresh_token=...&type=recovery
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');

        if (type !== 'recovery') {
          setError('Lien de réinitialisation invalide ou expiré. Vérifiez que vous avez cliqué sur le lien complet dans l\'email.');
          setIsValidatingToken(false);
          return;
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            setError('Session de réinitialisation invalide ou expirée. Demandez un nouveau lien.');
          }
          setIsValidatingToken(false);
          return;
        }

        // Dernier fallback: session déjà active après redirection
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError('Token de réinitialisation manquant. Vérifiez que vous avez cliqué sur le lien complet dans l\'email.');
        }
      } catch {
        setError('Impossible de vérifier le lien de réinitialisation. Réessayez avec un nouveau lien.');
      } finally {
        setIsValidatingToken(false);
      }
    };

    initializeRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || 'Erreur lors de la réinitialisation du mot de passe.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch (err) {
      setError('Une erreur inattendue s\'est produite.');
      setIsLoading(false);
      console.error('Erreur reset password:', err);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-beige-50">
        <div className="text-neutral-600">Vérification du lien...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-beige-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h2 className="text-2xl font-bold text-neutral-900">Mot de passe réinitialisé !</h2>
              <p className="text-neutral-600">Vous allez être redirigé vers la page de connexion...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-beige-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-neutral-900">
            Réinitialiser votre mot de passe
          </CardTitle>
          <p className="mt-2 text-sm text-neutral-600">
            Entrez votre nouveau mot de passe ci-dessous
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                placeholder="Au moins 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
                Confirmer le mot de passe
              </label>
              <Input
                type="password"
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              size="md" 
              variant="beige"
              disabled={isLoading}
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/auth"
              className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
            >
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
