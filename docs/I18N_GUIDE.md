# 🌍 Guide i18n TeamWise - Documentation développeur

## 📋 Vue d'ensemble

TeamWise utilise **react-i18next** pour l'internationalisation complète de l'application.

**Langues supportées:**
- 🇫🇷 Français (FR)
- 🇬🇧 Anglais (EN)

**Statut:** ✅ 100% des pages internationalisées

---

## 📁 Structure des fichiers

```
src/i18n/
├── index.ts                  # Configuration i18next
├── fr/
│   ├── translation.json      # Traductions françaises (420+ lignes)
│   └── terms.json            # Conditions d'utilisation FR
└── en/
    ├── translation.json      # Traductions anglaises (420+ lignes)
    └── terms.json            # Conditions d'utilisation EN
```

---

## 🔑 Organisation des clés (20 domaines)

### common (27 clés)
Actions et textes communs utilisés partout dans l'app.

```typescript
t("common.loading")      // "Chargement..." / "Loading..."
t("common.save")         // "Enregistrer" / "Save"
t("common.cancel")       // "Annuler" / "Cancel"
t("common.error")        // "Une erreur est survenue" / "An error occurred"
t("common.copied")       // "Copié" / "Copied"
```

### auth (15 clés)
Authentification et connexion.

```typescript
t("auth.login")                 // "Se connecter" / "Login"
t("auth.logout")                // "Se déconnecter" / "Logout"
t("auth.logout_confirm")        // "Se déconnecter ?" / "Logout?"
t("auth.login_with_steam")      // "Se connecter avec Steam"
t("auth.welcome_title")         // "Bienvenue sur TeamWise"
t("auth.platform_tagline")      // "La plateforme de management..."
```

### team (52 clés)
Gestion des équipes, création, paramètres.

```typescript
t("team.select_title")          // "Sélectionnez votre équipe"
t("team.create_team")           // "Créer une équipe"
t("team.team_name")             // "Nom de l'équipe"
t("team.game_cs2")              // "Counter-Strike 2"
t("team.update_success")        // "Équipe mise à jour avec succès"
```

### profile (55 clés)
Profils utilisateurs, validation, placeholders.

```typescript
t("profile.complete_title")     // "Complétez votre profil"
t("profile.first_name")         // "Prénom" / "First name"
t("profile.email_required")     // "L'email est obligatoire"
t("profile.email_invalid")      // "Format d'email invalide"
```

### management (68 clés)
Gestion complète de l'équipe, membres, rôles.

```typescript
t("management.overview")        // "Vue d'ensemble"
t("management.members")         // "Membres"
t("management.kick_confirm", { nickname })  // Avec paramètre
t("management.role_updated")    // "Rôle mis à jour"
```

### nav (10 clés)
Navigation principale de l'app.

```typescript
t("nav.team")           // "Équipe" / "Team"
t("nav.management")     // "Management"
t("nav.agenda")         // "Planning" / "Schedule"
t("nav.scrims")         // "Scrims"
```

### roles (6 clés)
Rôles des membres de l'équipe.

```typescript
t("roles.PLAYER")       // "Joueur" / "Player"
t("roles.COACH")        // "Coach"
t("roles.ANALYST")      // "Analyste" / "Analyst"
t("roles.MANAGER")      // "Manager"
```

### create_team (12 clés)
Formulaire de création d'équipe en 3 étapes.

```typescript
t("create_team.title")             // "Créer votre équipe"
t("create_team.step_1_title")      // "Informations"
t("create_team.step_1_description") // "Les bases de votre équipe"
t("create_team.creating")          // "Création..."
```

### pages (12 clés)
Pages spécifiques de l'app.

```typescript
t("pages.scrims.title")       // "Scrims"
t("pages.scrims.subtitle")    // "Organisez et suivez vos matchs..."
t("pages.stats.title")        // "Statistiques" / "Statistics"
```

---

## 🎨 Utilisation dans les composants

### Import basique
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t("common.loading")}</h1>;
}
```

### Avec paramètres (interpolation)
```typescript
const { t } = useTranslation();

// Texte avec variable
<p>{t("team.welcome", { nickname: "John" })}</p>
// → "Bienvenue John 👋"

// Confirmation avec nom
<p>{t("management.kick_confirm", { nickname: member.nickname })}</p>
// → "Voulez-vous vraiment exclure John ?"
```

### Avec namespace spécifique
```typescript
// Pour les conditions d'utilisation
const { t } = useTranslation('terms');

return <div>{t("title")}</div>;
```

### Changer de langue
```typescript
import { useTranslation } from 'react-i18next';

function LanguageSelector() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: 'fr' | 'en') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
  
  return (
    <button onClick={() => changeLanguage('en')}>
      English
    </button>
  );
}
```

---

## ✅ Checklist - Ajouter une nouvelle clé

Quand vous devez ajouter du texte dans l'interface:

1. ✅ **NE JAMAIS** écrire le texte en dur
2. ✅ Créer une clé dans `fr/translation.json`
3. ✅ Créer la même clé dans `en/translation.json`
4. ✅ Utiliser `t("domain.key")` dans le composant
5. ✅ Tester dans les 2 langues

### Exemple complet

**❌ Mauvais:**
```typescript
<button>Enregistrer</button>
```

**✅ Bon:**
```typescript
// 1. Ajouter dans fr/translation.json
{
  "common": {
    "save": "Enregistrer"
  }
}

// 2. Ajouter dans en/translation.json
{
  "common": {
    "save": "Save"
  }
}

// 3. Utiliser dans le composant
import { useTranslation } from 'react-i18next';

function MyButton() {
  const { t } = useTranslation();
  return <button>{t("common.save")}</button>;
}
```

---

## 🗂️ Conventions de nommage

### Structure des clés
```
domain.action_context
```

**Exemples:**
- `team.create_error` - Erreur lors de la création d'équipe
- `profile.email_invalid` - Email invalide
- `management.kick_confirm` - Confirmation d'exclusion
- `common.save` - Action générique

### Domaines recommandés
- `common` - Textes réutilisables partout
- `auth` - Authentification
- `team` - Équipes
- `profile` - Profils
- `management` - Gestion
- `nav` - Navigation
- `pages.{page}` - Pages spécifiques
- `errors` - Erreurs système

---

## 🧪 Tests

### Vérifier qu'une clé existe
```typescript
const { t, i18n } = useTranslation();

// Vérifier si une clé existe
const keyExists = i18n.exists('team.create_team');
console.log(keyExists); // true ou false
```

### Tester les 2 langues
1. Ouvrir l'app en français
2. Parcourir toutes les pages
3. Changer en anglais (sélecteur en haut à droite)
4. Reparcourir les mêmes pages
5. Vérifier la cohérence

---

## 🐛 Dépannage

### Texte non traduit (clé affichée)
**Problème:** `team.my_key` s'affiche au lieu du texte  
**Solution:** La clé n'existe pas dans le fichier de traduction

1. Vérifier `src/i18n/fr/translation.json`
2. Vérifier `src/i18n/en/translation.json`
3. Ajouter la clé manquante dans les 2 fichiers

### Langue ne change pas
**Problème:** Le texte reste en français  
**Solution:** Le composant n'utilise pas `t()`

1. Importer `useTranslation`
2. Utiliser `const { t } = useTranslation()`
3. Remplacer les textes en dur par `t("key")`

### Paramètre non remplacé
**Problème:** `{{nickname}}` s'affiche littéralement  
**Solution:** Oublié de passer le paramètre

```typescript
// ❌ Mauvais
t("team.welcome")

// ✅ Bon
t("team.welcome", { nickname: user.nickname })
```

---

## 📚 Ressources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- Fichiers de traduction: `src/i18n/`

---

**Dernière mise à jour:** 16 février 2026  
**Statut:** ✅ Production-ready  
**Maintenu par:** Équipe TeamWise

