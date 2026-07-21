'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import { authSupabase } from '@/src/lib/authSupabase';
import { auth } from '@/src/lib/auth';
import { userStore } from '@/src/lib/userStore';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const finalizeConfirmation = async () => {
      try {
        const supabase = createClient();
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        let sessionEstablished = false;
        let lastAuthError: string | null = null;

        const tokenHash = queryParams.get('token_hash');
        const otpType = queryParams.get('type');
        if (tokenHash && otpType) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as any,
          });
          if (verifyError) {
            lastAuthError = verifyError.message;
          } else {
            sessionEstablished = true;
          }
        }

        const code = queryParams.get('code');
        if (!sessionEstablished && code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            lastAuthError = exchangeError.message;
          } else {
            sessionEstablished = true;
          }
        }

        if (!sessionEstablished) {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              lastAuthError = sessionError.message;
            } else {
              sessionEstablished = true;
            }
          }
        }

        if (!sessionEstablished) {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            sessionEstablished = true;
          }
        }

        if (!sessionEstablished) {
          setError('Le lien de validation est invalide ou expiré.');
          return;
        }

        const currentUser = await authSupabase.getCurrentUser();
        if (!currentUser) {
          setError(lastAuthError || 'Impossible de finaliser la validation. Connectez-vous manuellement.');
          return;
        }

        auth.setCurrentUser(currentUser);
        userStore.setCurrentUser(currentUser);

        router.replace('/onboarding');
      } catch {
        setError('Erreur lors de la validation de l’email.');
      }
    };

    finalizeConfirmation();
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-beige-50 px-4">
      <div className="max-w-lg rounded-2xl border border-beige-200 bg-white p-6 text-center shadow-sm">
        {error ? (
          <p className="text-sm font-medium text-red-700">{error}</p>
        ) : (
          <p className="text-sm font-medium text-neutral-700">Validation de votre email en cours...</p>
        )}
      </div>
    </div>
  );
}
