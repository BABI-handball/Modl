# Guide d'intégration Supabase

## 📋 Étapes pour configurer Supabase

### 1. Créer un compte Supabase

1. Allez sur https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez votre **Project URL** et votre **anon key** (disponibles dans Settings > API)

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=votre-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

**⚠️ Important** : Ne commitez JAMAIS le fichier `.env.local` (il est déjà dans .gitignore)

### 3. Créer les tables dans Supabase

1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL (SQL Editor dans le menu de gauche)
3. Copiez-collez le contenu du fichier `supabase/migrations/001_initial_schema.sql`
4. Exécutez le script (bouton "Run")

### 4. Configurer l'authentification

Dans Supabase Dashboard :
1. Allez dans **Authentication** > **Providers**
2. Activez **Email** (déjà activé par défaut)
3. Optionnel : Configurez d'autres providers (Google, GitHub, etc.)

### 5. Tester la connexion

Une fois configuré, vous pouvez tester avec :

```typescript
import { createClient } from '@/src/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('users').select('*');
```

## 🔄 Migration depuis localStorage

Les fichiers suivants doivent être migrés progressivement :

1. `src/lib/auth.ts` → Utiliser Supabase Auth
2. `src/lib/users.ts` → Utiliser la table `users`
3. `src/lib/jobs.ts` → Utiliser la table `job_posts`
4. `src/lib/applications.ts` → Utiliser la table `applications`
5. `src/lib/messagesStore.ts` → Utiliser les tables `messages` et `message_threads`
6. `src/lib/reviewsStore.ts` → Utiliser la table `model_reviews`

## 📚 Documentation

- Supabase Docs : https://supabase.com/docs
- Supabase JS Client : https://supabase.com/docs/reference/javascript/introduction
- Next.js + Supabase : https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
