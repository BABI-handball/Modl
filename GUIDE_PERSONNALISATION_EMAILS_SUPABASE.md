# 📧 Guide de Personnalisation des Templates d'Email Supabase

## 📋 Vue d'ensemble

Supabase envoie automatiquement des emails pour différentes actions. Vous pouvez personnaliser ces templates directement dans le Dashboard Supabase.

---

## 🔐 Emails à Personnaliser

### 1. **Confirmation d'inscription** (Confirm sign up)
**Quand :** Envoyé quand un utilisateur s'inscrit  
**Action :** L'utilisateur doit cliquer sur le lien pour confirmer son email

### 2. **Invitation utilisateur** (Invite user)
**Quand :** Quand vous invitez un utilisateur à rejoindre l'application  
**Action :** L'utilisateur reçoit un lien pour créer son compte

### 3. **Magic Link** (Connexion sans mot de passe)
**Quand :** Quand un utilisateur demande une connexion par email  
**Action :** L'utilisateur reçoit un lien pour se connecter directement

### 4. **Changement d'email** (Change email address)
**Quand :** Quand un utilisateur change son adresse email  
**Action :** L'utilisateur doit confirmer sa nouvelle adresse email

### 5. **Réinitialisation de mot de passe** (Reset password) ⭐ **IMPORTANT**
**Quand :** Quand un utilisateur demande à réinitialiser son mot de passe  
**Action :** L'utilisateur reçoit un lien pour réinitialiser son mot de passe

### 6. **Réauthentification** (Reauthentication)
**Quand :** Quand un utilisateur doit se réauthentifier pour une action sensible  
**Action :** L'utilisateur reçoit un code ou un lien pour confirmer son identité

---

## 🎨 Comment Personnaliser les Templates

### Étape 1 : Accéder aux Templates

1. **Ouvrez Supabase Dashboard**
2. Allez dans **Authentication** > **Email Templates**
3. Vous verrez la liste de tous les templates disponibles

### Étave 2 : Modifier un Template

1. **Cliquez sur le template** que vous voulez modifier (ex: "Reset password")
2. Vous verrez deux onglets :
   - **Subject** : L'objet de l'email
   - **Body** : Le corps de l'email (HTML)

### Étape 3 : Personnaliser le Contenu

#### Variables Disponibles

Vous pouvez utiliser ces variables dans vos templates :

- `{{ .ConfirmationURL }}` - URL de confirmation/réinitialisation
- `{{ .Token }}` - Token de confirmation
- `{{ .TokenHash }}` - Hash du token
- `{{ .SiteURL }}` - URL de votre site
- `{{ .Email }}` - Email de l'utilisateur
- `{{ .RedirectTo }}` - URL de redirection après action

#### Exemple de Template Personnalisé

**Subject (Objet) :**
```
Réinitialisez votre mot de passe Modl
```

**Body (Corps) - HTML :**
```html
<h2>Bonjour !</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe sur Modl.</p>
<p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
<p>Ce lien expire dans 1 heure.</p>
<hr>
<p>L'équipe Modl</p>
```

---

## 📝 Templates Recommandés pour Modl

### 1. Confirmation d'inscription

**Subject :**
```
Bienvenue sur Modl - Confirmez votre email
```

**Body :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #B0B08C; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Bienvenue sur Modl ! 🎉</h2>
    <p>Bonjour,</p>
    <p>Merci de vous être inscrit sur Modl, la plateforme qui connecte les modèles, les marques et les photographes.</p>
    <p>Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirmer mon email</a>
    </p>
    <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
    <p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>
    <p>Ce lien expire dans 24 heures.</p>
    <p>Si vous n'avez pas créé de compte sur Modl, vous pouvez ignorer cet email.</p>
    <div class="footer">
      <p>Cordialement,<br>L'équipe Modl</p>
      <p>Si vous avez des questions, contactez-nous à support@modl.com</p>
    </div>
  </div>
</body>
</html>
```

### 2. Réinitialisation de mot de passe ⭐

**Subject :**
```
Réinitialisez votre mot de passe Modl
```

**Body :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #B0B08C; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Réinitialisation de votre mot de passe</h2>
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe sur Modl.</p>
    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Réinitialiser mon mot de passe</a>
    </p>
    <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
    <p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>
    <div class="warning">
      <strong>⚠️ Important :</strong>
      <ul>
        <li>Ce lien expire dans 1 heure</li>
        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
        <li>Votre mot de passe actuel reste valide si vous n'utilisez pas ce lien</li>
      </ul>
    </div>
    <div class="footer">
      <p>Cordialement,<br>L'équipe Modl</p>
      <p>Pour votre sécurité, ne partagez jamais ce lien avec personne.</p>
    </div>
  </div>
</body>
</html>
```

### 3. Magic Link (Connexion sans mot de passe)

**Subject :**
```
Votre lien de connexion Modl
```

**Body :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #B0B08C; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Votre lien de connexion Modl</h2>
    <p>Bonjour,</p>
    <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Modl :</p>
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Se connecter</a>
    </p>
    <p>Ce lien expire dans 1 heure et ne peut être utilisé qu'une seule fois.</p>
    <p>Si vous n'avez pas demandé ce lien de connexion, ignorez cet email.</p>
    <div class="footer">
      <p>Cordialement,<br>L'équipe Modl</p>
    </div>
  </div>
</body>
</html>
```

### 4. Changement d'email

**Subject :**
```
Confirmez votre nouvelle adresse email Modl
```

**Body :**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #B0B08C; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Confirmez votre nouvelle adresse email</h2>
    <p>Bonjour,</p>
    <p>Vous avez demandé à changer votre adresse email sur Modl.</p>
    <p>Pour confirmer cette modification, cliquez sur le bouton ci-dessous :</p>
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirmer mon email</a>
    </p>
    <p>Si vous n'avez pas demandé ce changement, ignorez cet email et votre adresse email actuelle restera inchangée.</p>
    <div class="footer">
      <p>Cordialement,<br>L'équipe Modl</p>
    </div>
  </div>
</body>
</html>
```

---

## ✅ Checklist de Personnalisation

- [ ] **Confirmation d'inscription** - Template personnalisé avec branding Modl
- [ ] **Réinitialisation de mot de passe** - Template clair avec instructions
- [ ] **Magic Link** - Template simple pour connexion rapide
- [ ] **Changement d'email** - Template de confirmation
- [ ] **Invitation utilisateur** - Template d'invitation (si utilisé)
- [ ] **Réauthentification** - Template de sécurité (si utilisé)

---

## 🎨 Conseils de Design

1. **Couleurs** : Utilisez les couleurs de votre marque (beige #B0B08C pour Modl)
2. **Logo** : Ajoutez votre logo en haut de l'email
3. **Responsive** : Assurez-vous que l'email s'affiche bien sur mobile
4. **Clarté** : Messages courts et directs
5. **Call-to-Action** : Boutons clairs et visibles
6. **Sécurité** : Mentionnez toujours les délais d'expiration et les avertissements de sécurité

---

## 📍 Où Modifier dans Supabase

1. **Dashboard Supabase** > **Authentication** > **Email Templates**
2. Cliquez sur le template à modifier
3. Modifiez le **Subject** et le **Body**
4. Cliquez sur **Save** pour sauvegarder

---

## 🔗 Variables Supabase Disponibles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | URL complète avec token | `https://votre-app.com/auth/reset-password#access_token=...` |
| `{{ .Token }}` | Token brut | `abc123...` |
| `{{ .TokenHash }}` | Hash du token | `xyz789...` |
| `{{ .SiteURL }}` | URL de base du site | `https://votre-app.com` |
| `{{ .Email }}` | Email de l'utilisateur | `user@example.com` |
| `{{ .RedirectTo }}` | URL de redirection | `/auth/reset-password` |

---

## ⚠️ Notes Importantes

1. **Testez toujours** : Envoyez-vous un email de test après modification
2. **Sauvegardez** : Les modifications sont immédiatement actives
3. **Backup** : Copiez le template original avant modification
4. **HTML** : Utilisez du HTML simple, certains clients email ne supportent pas tout
5. **Variables** : N'oubliez pas `{{ .ConfirmationURL }}` dans les templates de confirmation

---

## 🚀 Quand Faire Ces Modifications

**Faites ces modifications :**
- ✅ Avant le déploiement en production
- ✅ Quand vous voulez améliorer l'expérience utilisateur
- ✅ Pour ajouter votre branding

**Vous pouvez le faire plus tard**, mais c'est mieux de le faire avant le lancement public pour avoir des emails professionnels dès le début !

---

Ce guide est prêt pour quand vous voudrez personnaliser les emails ! 📧✨
