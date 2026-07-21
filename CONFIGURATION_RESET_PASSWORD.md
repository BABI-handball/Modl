# 🔧 Configuration Reset Password - Guide Complet

## ✅ Code Application : CORRECT

Le code de l'application est déjà correct :
- ✅ Page `/auth/reset-password` existe et fonctionne
- ✅ Extraction du token depuis l'URL hash (`#access_token=...`)
- ✅ URL de redirection configurée dans le code

## ⚠️ Configuration Supabase Requise

Pour que le reset password fonctionne, vous devez configurer l'URL de redirection dans Supabase Dashboard.

### Étapes à suivre :

1. **Allez dans Supabase Dashboard**
   - Ouvrez votre projet Supabase
   - Allez dans **Settings** > **Authentication** > **URL Configuration**

2. **Configurez les URLs suivantes :**

   **Site URL :**
   ```
   http://localhost:3000
   ```
   (Pour la production, utilisez votre URL de production, ex: `https://votre-app.vercel.app`)

   **Redirect URLs :**
   Ajoutez ces URLs (une par ligne) :
   ```
   http://localhost:3000/auth/reset-password
   http://localhost:3000/auth/reset-password/*
   https://votre-domaine.com/auth/reset-password
   https://votre-domaine.com/auth/reset-password/*
   ```

3. **Sauvegardez les changements**

### Comment tester :

1. Allez sur `/auth/forgot-password`
2. Entrez votre email
3. Cliquez sur "Envoyer le lien de réinitialisation"
4. Vérifiez votre email
5. Cliquez sur le lien dans l'email
6. Vous devriez être redirigé vers `/auth/reset-password` avec le token dans l'URL
7. Entrez votre nouveau mot de passe

### Si ça ne fonctionne toujours pas :

Vérifiez que :
- ✅ L'URL dans l'email pointe bien vers `/auth/reset-password`
- ✅ Le token est présent dans l'URL (après le `#`)
- ✅ La page `/auth/reset-password` s'affiche correctement
- ✅ Les URLs sont bien configurées dans Supabase Dashboard
