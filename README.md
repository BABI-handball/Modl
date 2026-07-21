# MODL

Plateforme mobile-first pour fluidifier les échanges entre mannequins/modèles, photographes et marques/enseignes.

## 🎯 Concept

MODL structure les castings et remplace les échanges flous sur Instagram par une plateforme dédiée :
- **Côté MODEL** : Expérience style Indeed (annonces claires, postulation simple)
- **Côté BRAND/ENSEIGNE** : Expérience style Tinder (swipe des candidatures)
- **Côté PHOTOGRAPHER** : Publication d'annonces + gestion de portfolio

## 🚀 Technologies

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 19**

## 📁 Architecture

```
modl/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentification mock
│   ├── onboarding/        # Choix du rôle
│   ├── jobs/             # Liste et détail des annonces
│   ├── post-job/         # Création d'annonce (BRAND/PHOTOGRAPHER)
│   ├── inbox/            # Candidatures reçues (BRAND/PHOTOGRAPHER)
│   ├── profile/          # Profil utilisateur
│   └── pricing/          # Page tarifs
├── src/
│   ├── types/            # Types TypeScript
│   ├── lib/              # Utilitaires (auth, utils)
│   ├── components/       # Composants React
│   │   ├── ui/          # Composants UI réutilisables
│   │   └── ...          # Composants spécifiques
│   └── data/            # Données mock
└── public/              # Assets statiques
```

## 🎨 Design System

- **Police** : Inter (Google Fonts)
- **Couleurs** : Palette sobre avec accent premium (noir/blanc/gris)
- **Style** : Mobile-first, responsive, design moderne et épuré

## 📦 Installation

```bash
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🔐 Authentification (Mode Mock)

Pour cette V1, l'authentification est mockée :
- Utilisez n'importe quel email pour vous connecter
- Le rôle sera défini à l'onboarding
- Les données sont stockées dans `localStorage`

## 📊 Données Mock

L'application inclut :
- **10 annonces** (jobs) variées
- **10 profils** utilisateurs (modèles, marques, photographes)
- **10 candidatures** avec différents statuts

## 🛣️ Routes

- `/` - Landing page
- `/auth` - Connexion/Inscription
- `/onboarding` - Choix du rôle
- `/jobs` - Liste des annonces
- `/jobs/[id]` - Détail d'une annonce
- `/post-job` - Publier une annonce (BRAND/PHOTOGRAPHER)
- `/inbox` - Candidatures reçues (BRAND/PHOTOGRAPHER)
- `/profile` - Profil utilisateur
- `/pricing` - Tarifs

## 🔄 Prochaines étapes

- Intégration Supabase pour la persistance
- Authentification réelle
- Upload d'images
- Notifications
- Messagerie intégrée

## 📝 Notes

Cette V1 est un MVP fonctionnel en mode mock, prêt à être connecté à Supabase pour la production.
