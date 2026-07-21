# 🚀 Guide de déploiement - MODL

## 📋 Prérequis

1. ✅ Projet Supabase créé
2. ✅ Migration SQL exécutée dans Supabase
3. ✅ Compte Vercel (gratuit) : https://vercel.com

## 🔧 Étape 1 : Configuration Supabase

### 1.1 Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** (⚙️) > **API**
2. Vous verrez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : Une longue clé commençant par `eyJ...`
3. **Copiez ces deux valeurs** - vous en aurez besoin pour Vercel

### 1.2 Configurer Supabase Storage (pour les images)

Si vous stockez des images dans Supabase :

1. Dans Supabase Dashboard, allez dans **Storage**
2. Créez un bucket nommé `avatars` (ou `images`)
3. Configurez les politiques :
   - **Public** : Pour les images publiques (profils, annonces)
   - **Authenticated** : Pour les images privées

### 1.3 Configurer les URLs autorisées

1. Dans Supabase Dashboard, allez dans **Settings** > **API**
2. Dans **URL Configuration**, ajoutez :
   - `http://localhost:3000` (pour le développement local)
   - `https://votre-domaine.vercel.app` (sera ajouté après le déploiement)

## 🌐 Étape 2 : Déploiement sur Vercel

### 2.1 Préparer le projet

1. Assurez-vous que votre code est sur GitHub :
   ```bash
   git add .
   git commit -m "Préparation pour déploiement"
   git push
   ```

2. Vérifiez que `.env.local` est dans `.gitignore` (déjà fait ✅)

### 2.2 Déployer sur Vercel

**Option A : Via l'interface Vercel (recommandé)**

1. Allez sur https://vercel.com
2. Cliquez sur **"Add New Project"**
3. Importez votre repository GitHub
4. Configurez le projet :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)

5. **Variables d'environnement** - Ajoutez :
   - `NEXT_PUBLIC_SUPABASE_URL` = votre Project URL Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = votre anon key Supabase

6. Cliquez sur **"Deploy"**
7. ⏳ Attendez 2-3 minutes

**Option B : Via la CLI Vercel**

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Suivre les instructions
# Ajouter les variables d'environnement quand demandé
```

### 2.3 Ajouter le domaine de production dans Supabase

Une fois déployé, Vercel vous donnera une URL comme `https://modl-xxxxx.vercel.app`

1. Dans Supabase Dashboard > **Settings** > **API**
2. Ajoutez cette URL dans **URL Configuration** > **Site URL**
3. Ajoutez aussi dans **Redirect URLs** si vous utilisez l'auth

## ✅ Étape 3 : Vérification

1. Visitez votre URL Vercel
2. Testez la connexion Supabase
3. Testez l'authentification
4. Vérifiez que les données se chargent correctement

## 🔄 Étape 4 : Déploiements futurs

À chaque `git push` sur votre branche principale, Vercel redéploiera automatiquement.

Pour un déploiement manuel :
```bash
vercel --prod
```

## 🐛 Problèmes courants

### "Invalid API key" en production
- Vérifiez que les variables d'environnement sont bien configurées dans Vercel
- Redéployez après avoir ajouté/modifié les variables

### "CORS error"
- Vérifiez que l'URL de production est dans les URLs autorisées de Supabase

### "Image optimization error"
- Vérifiez que les domaines d'images sont dans `next.config.ts` > `images.remotePatterns`

## 📝 Checklist finale

- [ ] Projet Supabase créé
- [ ] Migration SQL exécutée
- [ ] Variables d'environnement configurées dans Vercel
- [ ] URLs autorisées configurées dans Supabase
- [ ] Application déployée et fonctionnelle
- [ ] Tests effectués (auth, données, images)
