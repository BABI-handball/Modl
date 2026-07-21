# 🎨 Personnalisations Oubliées - Checklist Complète

## 📋 Éléments Souvent Oubliés mais Importants

---

## 🚨 1. Pages d'Erreur Personnalisées

### ❌ Manquant Actuellement

Vous n'avez pas de pages d'erreur personnalisées. Next.js utilise les pages par défaut.

### ✅ À Créer

#### **Page 404 (Not Found)**

**Créer :** `app/not-found.tsx`

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center border-2 border-beige-200 shadow-xl">
        <CardContent className="p-8">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Page introuvable</h1>
          <p className="text-neutral-600 mb-6">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.back()} variant="outline">
              Retour
            </Button>
            <Button onClick={() => router.push('/')} variant="beige">
              Accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **Page Error Globale (500)**

**Créer :** `app/error.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Erreur:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white/80 via-beige-50/80 to-beige-100/80 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center border-2 border-red-200 shadow-xl">
        <CardContent className="p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Une erreur s'est produite</h1>
          <p className="text-neutral-600 mb-4">
            Désolé, quelque chose s'est mal passé. Notre équipe a été notifiée.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-red-600 mb-4 font-mono">
              {error.message}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={reset} variant="beige">
              Réessayer
            </Button>
            <Button onClick={() => router.push('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **Page Global Error Boundary**

**Créer :** `app/global-error.tsx`

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen bg-beige-50 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">
              Une erreur critique s'est produite
            </h1>
            <button
              onClick={reset}
              className="px-4 py-2 bg-beige-500 text-white rounded-lg hover:bg-beige-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

---

## 🔍 2. SEO et Meta Tags par Page

### ❌ Manquant Actuellement

Seul le meta de base existe dans `layout.tsx`. Chaque page devrait avoir ses propres meta tags.

### ✅ À Ajouter

#### **Meta Tags Dynamiques par Page**

**Exemple pour `/jobs/[id]/page.tsx` :**

```tsx
// Ajouter en haut du fichier
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await getJobById(params.id); // Fonction à créer
  
  return {
    title: `${job?.title} - MODL`,
    description: job?.description?.substring(0, 160) || 'Découvrez cette annonce sur MODL',
    openGraph: {
      title: job?.title || 'Annonce MODL',
      description: job?.description?.substring(0, 160) || '',
      images: job?.referenceImages?.[0] ? [job.referenceImages[0]] : [],
    },
  };
}
```

**Exemple pour `/profile/[id]/page.tsx` :**

```tsx
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getProfileById(params.id); // Fonction à créer
  
  return {
    title: `${profile?.name} - Profil MODL`,
    description: profile?.bio || `Découvrez le profil de ${profile?.name} sur MODL`,
    openGraph: {
      title: `${profile?.name} - MODL`,
      description: profile?.bio || '',
      images: profile?.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}
```

---

## 🎯 3. Favicon et Assets

### ⚠️ Problème Actuel

Le favicon utilise une URL Google Drive externe. Il faudrait un favicon local.

### ✅ À Faire

1. **Créer un favicon personnalisé**
   - Format : `.ico`, `.png`, ou `.svg`
   - Tailles : 16x16, 32x32, 48x48, 192x192, 512x512
   - Placer dans `app/favicon.ico` ou `public/favicon.ico`

2. **Créer un manifest.json pour PWA**

**Créer :** `app/manifest.ts` ou `public/manifest.json`

```tsx
// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MODL - Plateforme de casting mode',
    short_name: 'MODL',
    description: 'Fluidifie les échanges entre mannequins, photographes et marques',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#B0B08C',
    icons: [
      {
        src: '/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
```

---

## 🤖 4. robots.txt et Sitemap

### ❌ Manquant Actuellement

Pas de `robots.txt` ni de `sitemap.xml` pour le SEO.

### ✅ À Créer

#### **robots.txt**

**Créer :** `app/robots.ts`

```tsx
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings/', '/test-supabase/'],
      },
    ],
    sitemap: 'https://votre-domaine.com/sitemap.xml',
  };
}
```

#### **sitemap.xml**

**Créer :** `app/sitemap.ts`

```tsx
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://votre-domaine.com'; // À remplacer par votre URL de production

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Ajouter d'autres pages importantes
  ];
}
```

---

## ⚙️ 5. Configuration Supabase Avancée

### 📧 Configuration Email SMTP (Optionnel mais Recommandé)

**Où :** Supabase Dashboard > Settings > Auth > SMTP Settings

**Pourquoi :** Utiliser votre propre domaine d'email au lieu de `noreply@mail.app.supabase.io`

**À Configurer :**
- SMTP Host (ex: `smtp.gmail.com`, `smtp.sendgrid.net`)
- SMTP Port (ex: `587`)
- SMTP User (votre email)
- SMTP Password (mot de passe d'application)
- Sender Email (ex: `noreply@modl.com`)
- Sender Name (ex: `MODL`)

### 🔒 Rate Limiting et Sécurité

**Où :** Supabase Dashboard > Settings > API

**À Vérifier :**
- [ ] Rate limits configurés (éviter les abus)
- [ ] CORS configuré correctement
- [ ] JWT expiration time (défaut: 3600s = 1h)
- [ ] Refresh token rotation activé

### 📊 Quotas et Monitoring

**Où :** Supabase Dashboard > Settings > Usage

**À Surveiller :**
- [ ] Database size
- [ ] API requests
- [ ] Storage usage
- [ ] Bandwidth usage

---

## 💬 6. Messages d'Erreur Personnalisés

### ⚠️ À Améliorer

Les messages d'erreur Supabase sont parfois techniques. Personnalisez-les pour être plus clairs.

### ✅ Exemples de Messages Personnalisés

**Dans `src/lib/authSupabase.ts` :**

```typescript
// Au lieu de : "Invalid login credentials"
// Afficher : "Email ou mot de passe incorrect. Vérifiez vos identifiants."

// Au lieu de : "Email not confirmed"
// Afficher : "Veuillez confirmer votre email. Vérifiez votre boîte de réception (et les spams)."

// Au lieu de : "User already registered"
// Afficher : "Cet email est déjà utilisé. Connectez-vous ou réinitialisez votre mot de passe."
```

**Créer un fichier :** `src/lib/errorMessages.ts`

```typescript
export const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
  'User already registered': 'Cet email est déjà utilisé.',
  'Email rate limit exceeded': 'Trop de tentatives. Veuillez attendre quelques minutes.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  // Ajouter d'autres messages...
};

export function getErrorMessage(error: any): string {
  const errorMessage = error?.message || String(error);
  
  // Chercher un message personnalisé
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }
  
  // Message par défaut
  return 'Une erreur s\'est produite. Veuillez réessayer.';
}
```

---

## 🎨 7. Personnalisation des Messages de Validation

### ⚠️ À Améliorer

Les messages de validation HTML5 sont basiques. Personnalisez-les.

### ✅ Exemples

**Dans les formulaires :**

```tsx
<Input
  type="email"
  required
  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
  title="Veuillez entrer une adresse email valide"
  onInvalid={(e) => {
    e.currentTarget.setCustomValidity('Veuillez entrer une adresse email valide');
  }}
  onInput={(e) => {
    e.currentTarget.setCustomValidity('');
  }}
/>
```

---

## 📱 8. PWA (Progressive Web App)

### ❌ Manquant Actuellement

Pas de configuration PWA pour installer l'app sur mobile.

### ✅ À Ajouter

1. **Manifest** (déjà mentionné ci-dessus)
2. **Service Worker** (optionnel, pour fonctionnement offline)
3. **Icons** pour différentes tailles d'écran

---

## 🔔 9. Notifications Browser (Optionnel)

### ❌ Manquant Actuellement

Pas de notifications push.

### ✅ À Ajouter Plus Tard

- Demander permission pour notifications
- Envoyer notifications pour nouveaux messages
- Envoyer notifications pour nouvelles candidatures

---

## 📊 10. Analytics (Optionnel mais Recommandé)

### ❌ Manquant Actuellement

Pas d'analytics pour suivre l'utilisation.

### ✅ À Ajouter

**Google Analytics 4 :**

1. Créer un compte Google Analytics
2. Ajouter le script dans `app/layout.tsx`
3. Tracker les événements importants (inscription, création annonce, etc.)

**Ou Supabase Analytics :**
- Déjà disponible dans Supabase Dashboard
- Pas besoin de code supplémentaire

---

## 🎯 11. Messages de Succès Personnalisés

### ⚠️ À Améliorer

Les messages de succès sont basiques. Ajoutez plus de contexte.

### ✅ Exemples

**Au lieu de :** "Succès"
**Afficher :** "Annonce créée avec succès ! Elle est maintenant visible par tous les modèles."

**Au lieu de :** "Message envoyé"
**Afficher :** "Message envoyé ! Votre interlocuteur sera notifié."

---

## 🔐 12. Configuration de Sécurité Supabase

### ⚠️ À Vérifier

**Dans Supabase Dashboard > Settings > Auth :**

- [ ] **Email confirmation** : Activé ou désactivé selon vos besoins
- [ ] **Password requirements** : Configurer les règles de mot de passe
- [ ] **Session timeout** : Configurer la durée de session
- [ ] **MFA (Multi-Factor Auth)** : Activer si nécessaire
- [ ] **Email change** : Configurer la vérification du changement d'email

---

## 📝 13. Messages de Placeholder Personnalisés

### ⚠️ À Améliorer

Les placeholders sont basiques. Rendez-les plus engageants.

### ✅ Exemples

**Au lieu de :** "Tapez votre message..."
**Utiliser :** "Écrivez votre message... (Vous pouvez joindre des photos)"

**Au lieu de :** "Rechercher..."
**Utiliser :** "Rechercher une annonce, un modèle..."

---

## 🎨 14. Loading States Personnalisés

### ⚠️ À Améliorer

Les loading states sont basiques. Ajoutez des skeletons élégants.

### ✅ À Créer

**Composant Skeleton :** `src/components/ui/Skeleton.tsx`

```tsx
export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={`animate-pulse bg-beige-200 rounded ${className}`} />
  );
};
```

**Utilisation :**
```tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  <ActualContent />
)}
```

---

## 🌐 15. Configuration Multi-Langue (Optionnel)

### ❌ Manquant Actuellement

L'app est uniquement en français.

### ✅ À Ajouter Plus Tard (Si Besoin)

- Utiliser `next-intl` ou `react-i18next`
- Traduire tous les textes
- Détecter la langue du navigateur

---

## 📱 16. Responsive Design - Tests Mobile

### ⚠️ À Vérifier

Tester sur différents appareils :
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablette iPad
- [ ] Tablette Android
- [ ] Desktop (Chrome, Firefox, Safari)

---

## 🎯 Checklist Complète des Personnalisations

### Priorité Haute 🔴
- [ ] **Pages d'erreur** (404, 500, global-error)
- [ ] **Meta tags SEO** par page
- [ ] **Favicon local** (remplacer URL Google Drive)
- [ ] **robots.txt** et **sitemap.xml**
- [ ] **Messages d'erreur** personnalisés en français

### Priorité Moyenne 🟡
- [ ] **Manifest PWA**
- [ ] **Loading states** avec skeletons
- [ ] **Messages de validation** personnalisés
- [ ] **Placeholders** plus engageants
- [ ] **Configuration SMTP** Supabase (email custom)

### Priorité Basse 🟢
- [ ] **Analytics** (Google Analytics ou Supabase)
- [ ] **Notifications push** (plus tard)
- [ ] **Multi-langue** (si besoin)
- [ ] **Service Worker** pour PWA offline

---

## 📍 Où Trouver les Configurations

### Dans Supabase Dashboard :
1. **Authentication** > **Email Templates** → Personnaliser les emails
2. **Authentication** > **URL Configuration** → URLs de redirection
3. **Settings** > **API** → Rate limits, CORS
4. **Settings** > **Auth** > **SMTP Settings** → Email personnalisé
5. **Settings** > **Usage** → Surveiller les quotas

### Dans le Code :
1. **Meta tags** → `app/layout.tsx` et chaque page
2. **Pages d'erreur** → `app/not-found.tsx`, `app/error.tsx`
3. **Messages d'erreur** → `src/lib/errorMessages.ts`
4. **SEO** → `app/robots.ts`, `app/sitemap.ts`
5. **PWA** → `app/manifest.ts`

---

## 🎉 Résumé

**Ce qui est déjà fait :**
- ✅ Migration Supabase complète
- ✅ Reset password fonctionnel
- ✅ Section avis ajoutée
- ✅ Toutes les fonctionnalités migrées

**Ce qu'il reste à personnaliser :**
- 📧 Templates d'email (guide disponible)
- 🎨 Améliorations esthétiques (en continu)
- 🚨 Pages d'erreur (à créer)
- 🔍 SEO et meta tags (à améliorer)
- 🎯 Messages personnalisés (à améliorer)

**Vous avez tout le temps nécessaire !** Ces améliorations peuvent être faites progressivement. L'application fonctionne déjà très bien ! ✨
