# Migration des Profils Utilisateurs vers Supabase

## ✅ Ce qui a été fait

### 1. Store Supabase créé (`src/lib/userProfilesSupabase.ts`)
- `getModelProfile(userId)` - Récupérer un profil modèle depuis Supabase
- `setModelProfile(profile)` - Créer/mettre à jour un profil modèle dans Supabase
- `getPhotographerProfile(userId)` - Récupérer un profil photographe depuis Supabase
- `setPhotographerProfile(profile)` - Créer/mettre à jour un profil photographe dans Supabase
- `getBrandProfile(userId)` - Récupérer un profil marque depuis Supabase
- `setBrandProfile(profile)` - Créer/mettre à jour un profil marque dans Supabase

### 2. Migration SQL (`supabase/migrations/006_add_photographer_fields.sql`)
- Ajout des champs manquants à `photographer_profiles` :
  - `portfolio_images TEXT[]`
  - `specialties TEXT[]`
  - `portfolio_link TEXT`
  - `equipment TEXT`
  - `style TEXT`
- Ajout de `email` aux tables `brand_profiles` et `model_profiles`
- Ajout de `experience_years` et `gender` à `model_profiles`

### 3. Intégration dans `userStore.ts`
- Les fonctions `setModelProfile`, `setPhotographerProfile`, `setBrandProfile` sauvegardent maintenant automatiquement dans Supabase en arrière-plan
- Les fonctions `getModelProfile`, `getPhotographerProfile`, `getBrandProfile` vérifient Supabase en arrière-plan pour synchroniser les données
- Le localStorage reste la source principale pour un chargement instantané
- Supabase sert de backup et de synchronisation entre appareils

## 📋 Prochaines étapes

### 1. Exécuter la migration SQL
Exécutez `supabase/migrations/006_add_photographer_fields.sql` dans l'éditeur SQL de Supabase pour ajouter les champs manquants.

### 2. Tester la migration
1. Créer un nouveau profil sur l'onboarding
2. Vérifier dans Supabase que le profil apparaît dans la table correspondante
3. Modifier le profil depuis l'application
4. Vérifier que les modifications sont synchronisées dans Supabase

### 3. Vérifier les RLS (Row Level Security)
Assurez-vous que les politiques RLS sont correctement configurées pour permettre :
- La lecture de son propre profil
- La création/mise à jour de son propre profil
- La lecture des profils publics (pour les recherches)

## 🔄 Fonctionnement actuel

1. **Création de profil** : Sauvegarde immédiate dans localStorage + sauvegarde Supabase en arrière-plan
2. **Lecture de profil** : Chargement immédiat depuis localStorage + vérification Supabase en arrière-plan pour synchroniser
3. **Modification de profil** : Mise à jour immédiate dans localStorage + mise à jour Supabase en arrière-plan

## ⚠️ Notes importantes

- Les profils sont toujours chargés depuis localStorage en premier pour un rendu instantané
- Supabase sert de backup et de synchronisation, mais ne bloque jamais l'interface
- Si Supabase échoue, l'application continue de fonctionner avec localStorage
- Les profils créés localement sont automatiquement synchronisés avec Supabase en arrière-plan
