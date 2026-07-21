# ✅ Vérification de la configuration Supabase

## 🔍 Vérifications à faire après avoir intégré MCP Supabase

### 1. Vérifier que le trigger existe

Dans Supabase Dashboard > SQL Editor, exécutez cette requête :

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Si rien ne s'affiche, le trigger n'existe pas. Exécutez ce SQL :

```sql
-- Fonction pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'MODEL' -- Rôle par défaut, sera mis à jour à l'onboarding
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement l'entrée dans users quand un utilisateur s'inscrit
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Vérifier que la politique INSERT existe

Dans Supabase Dashboard > Authentication > Policies, vérifiez que la table `users` a une politique INSERT.

Sinon, exécutez :

```sql
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. Désactiver la confirmation email (pour le développement)

1. Dans Supabase Dashboard, allez dans **Authentication** > **Settings**
2. Désactivez **"Enable email confirmations"**
3. Cliquez sur **"Save"**

⚠️ **Important** : Réactivez-la en production !

### 4. Tester l'inscription

1. Allez sur `/auth`
2. Créez un compte avec un email et un mot de passe
3. Vérifiez dans Supabase Dashboard :
   - **Authentication** > **Users** : Vous devriez voir le nouvel utilisateur
   - **Table Editor** > **users** : Vous devriez voir l'entrée correspondante

### 5. Si ça ne fonctionne toujours pas

Vérifiez les logs dans la console du navigateur (F12) pour voir l'erreur exacte.

Les erreurs courantes :
- **"new row violates row-level security policy"** → La politique INSERT n'existe pas
- **"relation does not exist"** → La table users n'existe pas (relancer la migration complète)
- **"permission denied"** → Problème de permissions RLS

## 📝 Checklist

- [ ] Trigger `on_auth_user_created` créé
- [ ] Politique INSERT pour la table `users` créée
- [ ] Confirmation email désactivée (dev uniquement)
- [ ] Test d'inscription réussi
- [ ] Utilisateur visible dans Authentication > Users
- [ ] Entrée visible dans Table Editor > users
