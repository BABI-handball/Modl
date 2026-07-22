'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useRequireUser } from '@/src/hooks/useRequireUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { resetDemoData } from '@/src/lib/seed';
import { userStore } from '@/src/lib/userStore';
import { auth } from '@/src/lib/auth';
import { devAccounts } from '@/src/lib/devAccounts';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useRequireUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-beige-50 flex items-center justify-center">
        <div className="text-neutral-600">Chargement...</div>
      </div>
    );
  }

  const handleResetDemo = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données de démo ? Cette action est irréversible.')) {
      resetDemoData();
      router.push('/jobs');
      window.location.reload(); // Force reload pour rafraîchir toutes les données
    }
  };

  const handleLogout = () => {
    userStore.logout();
    auth.logout();
    router.push('/auth');
  };

  const handleLoadNewModelAccount = () => {
    const result = devAccounts.createNewModelAccount();
    auth.setCurrentUser(result.user);
    userStore.setCurrentUser(result.user);
    userStore.setModelProfile(result.profile);
    router.push('/profile');
    window.location.reload();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 overflow-hidden flex flex-col relative backdrop-blur-[0.5px]">
      {/* Pattern décoratif subtil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, #000 1px, transparent 1px)`,
        backgroundSize: '50px 50px',
      }}></div>
      <div className="flex-1 overflow-y-auto pb-40 sm:pb-28 relative z-10">
        <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-3xl font-bold text-neutral-900">Paramètres</h1>

        <Card className="mb-6 border-beige-200">
          <CardHeader>
            <CardTitle className="text-neutral-900">Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Email</p>
              <p className="font-medium text-neutral-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Rôle</p>
              <p className="font-medium text-neutral-900">
                {user.role === 'MODEL' ? 'Modèle' : user.role === 'BRAND' ? 'Marque' : 'Photographe'}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="w-full border-beige-300 hover:bg-beige-100">
              Déconnexion
            </Button>
          </CardContent>
        </Card>

        {process.env.NODE_ENV === 'development' && (
          <>
            <Card className="mb-6 border-beige-300 bg-beige-100">
              <CardHeader>
                <CardTitle className="text-neutral-900">Mode Démo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-neutral-700">
                  Réinitialise toutes les données de démo (annonces, candidatures, messages) tout en conservant votre compte actuel.
                </p>
                <Button
                  variant="outline"
                  onClick={handleResetDemo}
                  className="w-full border-beige-400 text-beige-700 hover:bg-beige-200"
                >
                  🔄 Reset Demo Data
                </Button>
              </CardContent>
            </Card>

            <Card className="mb-6 border-beige-200">
              <CardHeader>
                <CardTitle className="text-neutral-900">Compte Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-neutral-700">
                  Charge un nouveau compte modèle &quot;Sophie Martin&quot; avec toutes les mensurations détaillées pour tester l&apos;affichage.
                </p>
                <Button
                  variant="beige"
                  onClick={handleLoadNewModelAccount}
                  className="w-full"
                >
                  ✨ Charger nouveau compte modèle complet
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
