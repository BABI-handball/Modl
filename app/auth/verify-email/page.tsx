'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { createClient } from '@/src/lib/supabase/client';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get('email') || '');
  }, []);

  const handleResend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    setResendError('');
    setResendMessage('');
    try {
      const supabase = createClient();
      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/confirm-email`
          : undefined;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      });
      if (error) {
        setResendError(error.message || 'Impossible de renvoyer l’email pour le moment.');
      } else {
        setResendMessage('Email renvoyé. Vérifiez votre boîte de réception et vos spams.');
      }
    } catch {
      setResendError('Erreur réseau lors du renvoi. Réessayez dans quelques instants.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-beige-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-neutral-900">Confirmez votre email</CardTitle>
          <p className="mt-2 text-sm text-neutral-600">
            Un email de validation vient d&apos;être envoyé{email ? ` à ${email}` : ''}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-beige-200 bg-beige-50 p-3 text-sm text-neutral-700">
            Cliquez sur le lien reçu par email. Dès validation, vous serez redirigé automatiquement vers l&apos;application.
          </div>
          {resendMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700">
              {resendMessage}
            </div>
          )}
          {resendError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {resendError}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="beige"
              className="flex-1"
              onClick={handleResend}
              disabled={isResending || !email}
            >
              {isResending ? 'Envoi...' : 'Renvoyer l’email'}
            </Button>
            <Link href="/auth" className="flex-1">
              <Button variant="outline" className="w-full">
                Retour connexion
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
