# 🚀 Guide d'intégration Supabase - MODL

## 📋 Checklist de démarrage

### Étape 1 : Créer le projet Supabase

1. Allez sur https://supabase.com
2. Créez un compte (gratuit) ou connectez-vous
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name** : `modl` (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe fort (⚠️ **SAVEZ-LE**)
   - **Region** : Choisissez la région la plus proche (Europe pour la France)
5. Cliquez sur **"Create new project"**
6. ⏳ Attendez 2-3 minutes que le projet soit créé

### Étape 2 : Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** (⚙️) > **API**
2. Vous verrez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : Une longue clé commençant par `eyJ...`
3. **Copiez ces deux valeurs**

### Étape 3 : Configurer les variables d'environnement

1. Dans votre projet, créez un fichier `.env.local` à la racine :
   ```bash
   cp .env.local.example .env.local
   ```

2. Ouvrez `.env.local` et remplacez les valeurs :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. ⚠️ **NE COMMITEZ JAMAIS** ce fichier (il est déjà dans `.gitignore`)

### Étape 4 : Créer les tables dans Supabase

1. Dans Supabase Dashboard, allez dans **SQL Editor** (dans le menu de gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase/migrations/001_initial_schema.sql` dans votre éditeur
4. **Copiez tout le contenu** du fichier SQL
5. **Collez-le** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou `Cmd+Enter` / `Ctrl+Enter`)
7. ✅ Vous devriez voir "Success. No rows returned"

### Étape 5 : Vérifier que tout fonctionne

1. Redémarrez votre serveur de développement :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   npm run dev
   ```

2. Créez un fichier de test temporaire `app/test-supabase/page.tsx` :

```typescript
'use client';

import { createClient } from '@/src/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function TestSupabase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('users').select('count');
        
        if (error) {
          setStatus('error');
          setMessage(`Erreur: ${error.message}`);
          console.error('Erreur Supabase:', error);
        } else {
          setStatus('success');
          setMessage('✅ Connexion Supabase réussie! Les tables sont créées.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    };
    
    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de connexion Supabase</h1>
      <div className={`p-4 rounded-lg ${
        status === 'loading' ? 'bg-yellow-50 text-yellow-800' :
        status === 'success' ? 'bg-green-50 text-green-800' :
        'bg-red-50 text-red-800'
      }`}>
        {status === 'loading' && '⏳ Test de connexion...'}
        {status === 'success' && message}
        {status === 'error' && message}
      </div>
    </div>
  );
}
```

3. Allez sur `http://localhost:3000/test-supabase`
4. Si vous voyez "✅ Connexion Supabase réussie!", c'est bon ! 🎉

### Étape 6 : Activer l'authentification par email

1. Dans Supabase Dashboard, allez dans **Authentication** > **Providers**
2. Vérifiez que **Email** est activé (devrait l'être par défaut)
3. Optionnel : Configurez d'autres providers (Google, GitHub, etc.)

## 🔄 Migration progressive des stores

Une fois Supabase configuré, vous pouvez migrer progressivement :

### ✅ Déjà prêt
- `src/lib/authSupabase.ts` - Authentification
- `src/lib/jobsSupabase.ts` - Annonces

### ⏳ À créer
- `src/lib/applicationsSupabase.ts` - Candidatures
- `src/lib/messagesSupabase.ts` - Messages
- `src/lib/reviewsSupabase.ts` - Avis
- `src/lib/profilesSupabase.ts` - Profils utilisateurs

## 📝 Notes importantes

- **Toutes les fonctions Supabase sont asynchrones** → utilisez `async/await`
- **Les composants doivent être `'use client'`** pour utiliser le client Supabase
- **Pour SSR**, utilisez `createClient()` depuis `supabase/server.ts`
- **RLS (Row Level Security)** est activé - les politiques de sécurité sont déjà configurées dans le schéma SQL

## 🐛 Problèmes courants

### "Invalid API key"
- Vérifiez que `.env.local` existe et contient les bonnes valeurs
- Redémarrez le serveur après avoir créé/modifié `.env.local`

### "relation does not exist"
- Vous n'avez pas exécuté le script SQL
- Retournez à l'**Étape 4**

### "permission denied"
- Vérifiez les politiques RLS dans Supabase Dashboard > **Authentication** > **Policies**
- Les politiques de base sont déjà dans le schéma SQL

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
