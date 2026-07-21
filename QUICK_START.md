# ⚡ Démarrage rapide - Mise en ligne MODL

## Ce dont j'ai besoin de votre part

### 1. Variables d'environnement Supabase

Dans votre projet Supabase :
1. Allez dans **Settings** (⚙️) > **API**
2. Copiez ces deux valeurs :

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Exécuter la migration SQL

1. Dans Supabase Dashboard, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/migrations/001_initial_schema.sql` dans votre éditeur
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL de Supabase
5. Cliquez sur **"Run"**

### 3. Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

⚠️ **Remplacez** `xxxxx` et `votre-anon-key-ici` par vos vraies valeurs.

## 🚀 Une fois que vous avez ces informations

1. **Testez localement** :
   ```bash
   npm run dev
   ```
   Allez sur `http://localhost:3000` et vérifiez que tout fonctionne.

2. **Préparez pour Vercel** :
   - Assurez-vous que votre code est sur GitHub
   - Allez sur https://vercel.com
   - Importez votre projet
   - Ajoutez les variables d'environnement dans Vercel :
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Déployez !

## 📋 Checklist

- [ ] Projet Supabase créé
- [ ] Migration SQL exécutée
- [ ] Variables d'environnement récupérées
- [ ] Fichier `.env.local` créé avec les bonnes valeurs
- [ ] Test local réussi
- [ ] Code poussé sur GitHub
- [ ] Projet déployé sur Vercel
- [ ] Variables d'environnement configurées dans Vercel
- [ ] URL de production ajoutée dans Supabase (Settings > API > URL Configuration)

## 🆘 Besoin d'aide ?

Consultez les guides détaillés :
- `SUPABASE_INTEGRATION.md` - Configuration Supabase complète
- `DEPLOYMENT.md` - Guide de déploiement détaillé
