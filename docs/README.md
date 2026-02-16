# 📚 Documentation TeamWise Frontend - Design System & Architecture

## 📋 Table des matières

1. [Design System](./DESIGN_SYSTEM.md) - Système de design, composants, couleurs, typographie
2. [Architecture](./ARCHITECTURE.md) - Structure de l'application, routing, contexts
3. [Composants](./COMPONENTS.md) - Documentation des composants clés
4. [Pages](./PAGES.md) - Documentation des pages et leurs fonctionnalités
5. [Auth Flow](./AUTH_FLOW.md) - Flux d'authentification et gestion des équipes
6. [Permissions](./PERMISSIONS.md) - Système de permissions et rôles

---

## 🎨 Vue d'ensemble du Design System

### Philosophie
- **Premium & Moderne** : Design SaaS professionnel
- **Dark Mode** : Interface sombre avec gradients subtils
- **Cohérence** : Même style sur toutes les pages
- **Animations** : Transitions fluides (150-200ms)
- **Spacing** : 8pt grid system

### Stack Technique
- **React 18** + TypeScript
- **React Router v6** pour le routing
- **TailwindCSS** pour le styling
- **Lucide React** pour les icônes
- **i18next** pour l'internationalisation

---

## 🏗️ Architecture Globale

```
teamwise-frontend/
├── src/
│   ├── api/              # API clients et endpoints
│   ├── contexts/         # React Contexts (Auth, Team, Agenda)
│   ├── features/         # Features par domaine
│   ├── layouts/          # Layouts réutilisables
│   ├── pages/            # Pages de l'application
│   ├── router/           # Configuration du routing
│   ├── design-system/    # Composants du design system
│   └── styles/           # Styles globaux
```

---

## 🎯 Réalisations du 15 Février 2026

### ✅ Refonte complète de l'authentification
- LoginPage : Design premium avec gradient
- LoginSuccessPage : Loader élégant avec feedback
- SelectTeamPage : Cards interactives pour sélection d'équipe
- CreateTeamPage : Formulaire multi-étapes avec progress bar

### ✅ Nouveau système de navigation
- Suppression de la sidebar globale
- TeamSidebar contextuelle par équipe
- Navigation intégrée dans chaque feature
- Boutons Logout et Changement d'équipe séparés

### ✅ Pages Management refondues
- Progress bar avec onglets (Overview / Staff / Players / Settings)
- Design ultra premium cohérent
- Séparation Staff/Players
- Panels avec detail drawer

### ✅ Système de permissions
- Hook `useManagementPermissions` centralisé
- Respect strict du contrat UX v1.1
- Distinction Owner / Manager / Player

---

## 🚀 Pour reprendre le développement

1. **Lire** [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) pour comprendre les tokens de design
2. **Consulter** [ARCHITECTURE.md](./ARCHITECTURE.md) pour la structure
3. **Voir** [COMPONENTS.md](./COMPONENTS.md) pour les composants réutilisables
4. **Référencer** [PAGES.md](./PAGES.md) pour chaque page en détail

---

## 📝 Notes importantes

- Toujours utiliser le design system (couleurs, spacing, composants)
- Respecter la structure des layouts (TeamLayout pour pages team)
- Utiliser les hooks de contexte (useAuth, useTeam, useAgenda)
- Tester les permissions avec différents rôles (Owner, Manager, Player)

---

**Date de dernière mise à jour** : 15 Février 2026  
**Version** : 1.0.0  
**Statut** : En développement actif

