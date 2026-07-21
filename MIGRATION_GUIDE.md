# Guide de migration vers Supabase

## 🚀 Démarrage rapide

### 1. Configuration initiale

1. **Créez votre projet Supabase** : https://supabase.com
2. **Créez le fichier `.env.local`** :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
   ```
3. **Exécutez la migration SQL** : Copiez `supabase/migrations/001_initial_schema.sql` dans l'éditeur SQL de Supabase

### 2. Tester la connexion

Créez un fichier de test `test-supabase.tsx` :

```typescript
'use client';
import { createClient } from '@/src/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function TestSupabase() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('users').select('count');
      
      if (error) {
        console.error('Erreur Supabase:', error);
      } else {
        setConnected(true);
        console.log('✅ Connexion Supabase réussie!');
      }
    };
    
    testConnection();
  }, []);

  return <div>{connected ? '✅ Connecté' : '⏳ Connexion...'}</div>;
}
```

### 3. Migration progressive

#### Étape 1 : Authentification

Remplacez dans `app/auth/page.tsx` :

```typescript
// Avant
import { auth } from '@/src/lib/auth';
const result = usersStore.authenticate(email, password);

// Après
import { authSupabase } from '@/src/lib/authSupabase';
const result = await authSupabase.signIn(email, password);
```

#### Étape 2 : Jobs

Remplacez dans vos composants :

```typescript
// Avant
import { jobsStore } from '@/src/lib/jobs';
const jobs = jobsStore.getAll();

// Après
import { jobsStoreSupabase } from '@/src/lib/jobsSupabase';
const jobs = await jobsStoreSupabase.getAll();
```

⚠️ **Important** : Les fonctions Supabase sont **asynchrones** (`async/await`)

### 4. Structure des fichiers créés

- `src/lib/supabase/client.ts` - Client Supabase pour le navigateur
- `src/lib/supabase/server.ts` - Client Supabase pour le serveur (SSR)
- `src/lib/authSupabase.ts` - Authentification avec Supabase
- `src/lib/jobsSupabase.ts` - Gestion des annonces avec Supabase
- `supabase/migrations/001_initial_schema.sql` - Schéma de base de données

### 5. Prochaines étapes

1. ✅ Authentification (`authSupabase.ts`)
2. ✅ Jobs (`jobsSupabase.ts`)
3. ⏳ Applications (`applicationsSupabase.ts`)
4. ⏳ Messages (`messagesSupabase.ts`)
5. ⏳ Reviews (`reviewsSupabase.ts`)
6. ⏳ Profils utilisateurs (`profilesSupabase.ts`)

## 📝 Notes importantes

- **Toutes les fonctions Supabase sont asynchrones** - utilisez `async/await`
- **Les composants doivent être `'use client'`** pour utiliser le client Supabase
- **Pour SSR**, utilisez `createClient()` depuis `supabase/server.ts`
- **RLS (Row Level Security)** est activé - ajustez les politiques selon vos besoins

## 🔍 Debugging

Si vous avez des erreurs :

1. Vérifiez vos variables d'environnement dans `.env.local`
2. Vérifiez que les tables existent dans Supabase Dashboard
3. Vérifiez les politiques RLS dans Supabase Dashboard > Authentication > Policies
4. Consultez la console du navigateur pour les erreurs détaillées
