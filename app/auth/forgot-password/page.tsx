'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authSupabase } from '@/src/lib/authSupabase';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authSupabase.requestPasswordReset(email);

      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'envoi de l\'email.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      setError('Une erreur inattendue s\'est produite.');
      setIsLoading(false);
      console.error('Erreur forgot password:', err);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-beige-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <h2 className="text-2xl font-bold text-neutral-900">Email envoyé !</h2>
              <p className="text-neutral-600">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques instants.
              </p>
              <p className="text-sm text-neutral-500">
                Vérifiez votre boîte de réception et vos spams.
              </p>
              <Button
                onClick={() => router.push('/auth')}
                variant="beige"
                className="w-full mt-4"
              >
                Retour à la connexion
              </Button>
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
            Mot de passe oublié ?
          </CardTitle>
          <p className="mt-2 text-sm text-neutral-600">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-700">
                Email
              </label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
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
              {isLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
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
