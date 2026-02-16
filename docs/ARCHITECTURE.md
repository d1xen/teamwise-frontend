# 🏗️ Architecture - TeamWise Frontend

## 📂 Structure des Dossiers

```
src/
├── api/                    # Couche API
│   ├── client/
│   │   └── apiClient.ts    # Client HTTP configuré
│   ├── endpoints/
│   │   ├── auth.api.ts     # Endpoints authentification
│   │   ├── team.api.ts     # Endpoints équipes
│   │   └── invitation.api.ts
│   └── types/
│       ├── team.ts         # Types API teams
│       └── profile.ts      # Types API profils
│
├── contexts/               # React Contexts (état global)
│   ├── auth/
│   │   ├── AuthContext.tsx      # Provider auth
│   │   ├── auth.context.ts      # Context definition
│   │   ├── auth.types.ts        # Types auth
│   │   └── useAuth.ts           # Hook d'accès
│   ├── team/
│   │   ├── TeamContext.tsx      # Provider team
│   │   ├── team.context.ts
│   │   ├── team.types.ts
│   │   ├── useTeam.ts
│   │   └── useOptionalTeam.ts
│   └── agenda/
│       └── AgendaContext.tsx
│
├── features/               # Features par domaine métier
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginPage.tsx
│   │   │   └── LoginSuccessPage.tsx
│   │   └── services/
│   │       └── authNavigation.ts
│   ├── team/
│   │   ├── components/
│   │   │   ├── management/
│   │   │   │   ├── panels/
│   │   │   │   │   ├── TeamOverviewPanel.tsx
│   │   │   │   │   ├── MembersPanel.tsx
│   │   │   │   │   └── TeamSettingsPanel.tsx
│   │   │   │   └── MemberDrawerPremium.tsx
│   │   │   └── TeamEditForm.tsx
│   │   └── hooks/
│   │       ├── useManagementPermissions.ts  # ⭐ Hook permissions
│   │       ├── useTeamActions.ts
│   │       └── useTeamMembersSplit.ts
│   └── profile/
│       └── components/
│           └── CompleteProfilePage.tsx
│
├── layouts/                # Layouts réutilisables
│   ├── AppLayout.tsx            # Layout racine (toast, etc.)
│   ├── TeamLayout.tsx           # Layout avec TeamSidebar
│   ├── TeamProviderLayout.tsx   # Injecte TeamProvider
│   └── TeamSidebar.tsx          # Sidebar contextuelle équipe
│
├── pages/                  # Pages de l'application
│   ├── team/
│   │   ├── SelectTeamPage.tsx        # ⭐ Sélection d'équipe
│   │   ├── CreateTeamPage.tsx        # ⭐ Création équipe
│   │   ├── TeamPage.tsx              # Page vitrine (read-only)
│   │   ├── ManagementPage.tsx        # ⭐ Gestion équipe
│   │   ├── ScrimsPage.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── StratbookPage.tsx
│   │   └── StatsPage.tsx
│   └── agenda/
│       └── AgendaPage.tsx
│
├── router/                 # Configuration routing
│   ├── AppRouter.tsx            # ⭐ Routes principales
│   ├── RootRedirect.tsx         # Redirection racine
│   └── guards/
│       ├── RequireAuth.tsx      # Guard authentification
│       └── RequireTeam.tsx
│
├── design-system/          # Composants réutilisables
│   ├── components/
│   │   ├── Button.tsx           # ⭐ Bouton universel
│   │   ├── Input.tsx            # ⭐ Input universel
│   │   └── Badge.tsx
│   └── index.ts
│
└── styles/
    ├── globals.css              # Styles globaux + animations
    └── react-datepicker.css
```

---

## 🔄 Flow d'Architecture

### 1. Routing & Layouts

```
AppRouter (React Router)
    ↓
RequireAuth (guard)
    ↓
AppLayout (toast provider)
    ↓
┌─────────────────────────────────────┐
│ Pages sans team context            │
│ - SelectTeamPage                    │
│ - CreateTeamPage                    │
│ - CompleteProfilePage               │
└─────────────────────────────────────┘
    OU
┌─────────────────────────────────────┐
│ TeamProviderLayout                  │
│   ↓                                 │
│ TeamProvider + AgendaProvider       │
│   ↓                                 │
│ TeamLayout (avec TeamSidebar)       │
│   ↓                                 │
│ Pages team :                        │
│ - TeamPage                          │
│ - ManagementPage                    │
│ - AgendaPage                        │
│ - ScrimsPage, etc.                  │
└─────────────────────────────────────┘
```

### 2. Ordre des Routes (IMPORTANT)

```typescript
// ✅ CORRECT - Route spécifique AVANT route dynamique
{
  path: "/team/create",        // Route statique
  element: <CreateTeamPage />
},
{
  path: "/team/:teamId",       // Route dynamique
  element: <TeamProviderLayout />
}

// ❌ INCORRECT - Route dynamique matcherait "create"
{
  path: "/team/:teamId",
  // ...
},
{
  path: "/team/create",
  // ... jamais atteinte !
}
```

**Raison** : React Router match la première route qui correspond. Si `/team/:teamId` est avant, "create" sera considéré comme un teamId.

---

## 🎯 Contexts & State Management

### AuthContext

**Responsabilité** : Gérer l'authentification globale

**État** :
```typescript
{
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

**Méthodes** :
```typescript
login(token: string)
logout()
updateUser(partial: Partial<AuthUser>)
```

**Utilisation** :
```typescript
const { user, isAuthenticated, logout } = useAuth();
```

---

### TeamContext

**Responsabilité** : Charger et exposer les données de la team courante

**État** :
```typescript
{
  team: Team | null              // Infos équipe
  membership: TeamMembership     // Rôle de l'utilisateur
  members: TeamMember[]          // Liste des membres
  isLoading: boolean
  isReady: boolean
}
```

**Chargement** :
- Déclenché par le `teamId` dans l'URL
- Appelle `getTeam(teamId)` et `getMembers(teamId)`
- Se réinitialise quand on change d'équipe

**Utilisation** :
```typescript
const { team, membership, members, isLoading } = useTeam();
```

**⚠️ Important** : 
- `useTeam()` throw si utilisé hors TeamProvider
- `useOptionalTeam()` retourne `null` si pas de contexte

---

### AgendaContext

**Responsabilité** : Gérer les événements de l'agenda

**État** :
```typescript
{
  events: AgendaEvent[]
  isLoading: boolean
  reload: () => void
}
```

**Hiérarchie** :
```
TeamProvider
  └─ AgendaProvider  ← dépend de team
      └─ Pages
```

---

## 🔐 Système de Permissions

### Hook Central : `useManagementPermissions`

**Fichier** : `src/features/team/hooks/useManagementPermissions.ts`

**Input** :
```typescript
{
  currentSteamId: string
  membership: TeamMembership
}
```

**Output** : Fonctions de permission
```typescript
{
  canEditTeam: () => boolean
  canInvite: () => boolean
  canEditMemberProfile: (member: TeamMember) => boolean
  canEditMemberRole: (member: TeamMember) => boolean
  canKickMember: (member: TeamMember) => boolean
  canTransferOwnership: (member: TeamMember) => boolean
  canLeave: (member: TeamMember) => boolean
}
```

**Logique** :
```typescript
// Owner peut tout faire
if (membership.isOwner) return true;

// Manager peut éditer mais pas transférer ownership
if (membership.role === "MANAGER") {
  // Peut éditer profil et rôle de tous (même Owner)
  // Ne peut pas kick Owner
  // Ne peut pas transférer ownership
}

// Player ne peut éditer que son profil
```

**Utilisation dans une page** :
```typescript
const { membership } = useTeam();
const { user } = useAuth();

const permissions = useManagementPermissions({
  currentSteamId: user.steamId,
  membership,
});

if (permissions.canEditTeam()) {
  // Afficher bouton édition
}
```

---

## 🧩 Patterns Architecturaux

### 1. Feature-Based Structure

Chaque feature (auth, team, profile) est isolée dans son dossier avec :
- Components
- Hooks
- Services (optionnel)
- Types (optionnel)

**Avantages** :
- Code colocalisé par domaine
- Facile à naviguer
- Facile à supprimer/déplacer

---

### 2. Layout Composition

```typescript
// Page sans team context
<AppLayout>
  <SelectTeamPage />
</AppLayout>

// Page avec team context
<AppLayout>
  <TeamProviderLayout>
    <TeamLayout>
      <ManagementPage />
    </TeamLayout>
  </TeamProviderLayout>
</AppLayout>
```

**Responsabilités** :
- `AppLayout` : Toast notifications, modals globales
- `TeamProviderLayout` : Injecte TeamProvider + AgendaProvider
- `TeamLayout` : Structure page (sidebar + content)

---

### 3. Hooks Pattern

**Custom hooks pour logique réutilisable** :

```typescript
// Permissions
useManagementPermissions({ currentSteamId, membership })

// Actions team
useTeamActions({ teamId, currentUserSteamId, isOwner })

// Split members
useTeamMembersSplit(members) 
// → { staffMembers, playerMembers }
```

---

### 4. Guard Pattern

```typescript
// RequireAuth : Redirige vers /login si non connecté
<Route element={<RequireAuth />}>
  <Route path="/select-team" element={<SelectTeamPage />} />
</Route>

// TeamProviderLayout : Vérifie profil complété
if (!user.profileCompleted && teamId) {
  return <Navigate to="/complete-profile" />;
}
```

---

## 📡 API Layer

### apiClient

**Fichier** : `src/api/client/apiClient.ts`

**Configuration** :
```typescript
const apiClient = <T>(url: string, options?: RequestInit): Promise<T> => {
  // Ajoute automatiquement le token
  // Gère les erreurs HTTP
  // Parse JSON
  // Appelle unauthorized handler si 401
}
```

**Unauthorized Handler** :
```typescript
setUnauthorizedHandler(() => {
  clearToken();
  navigate("/login");
});
```

### Endpoints

**Structure** :
```typescript
// team.api.ts
export function getTeam(teamId: string): Promise<TeamDto>
export function getMembers(teamId: string): Promise<TeamMemberDto[]>
export function createTeam(payload: CreateTeamRequest): Promise<TeamDto>
// ...
```

**Typage** :
- Request types : `CreateTeamRequest`, `UpdateTeamRequest`
- Response types : `TeamDto`, `TeamMemberDto`
- Séparation claire API types ↔️ App types

---

## 🔄 Flux de Données

### Chargement d'une équipe

```
1. User clique sur team dans SelectTeamPage
   ↓
2. navigate(`/team/${teamId}`)
   ↓
3. Route match `/team/:teamId`
   ↓
4. TeamProviderLayout monte
   ↓
5. TeamProvider useEffect détecte teamId
   ↓
6. Appelle getTeam(teamId) + getMembers(teamId)
   ↓
7. setTeam(), setMembership(), setMembers()
   ↓
8. TeamLayout + Page montent avec données
   ↓
9. Page utilise useTeam() pour accéder aux données
```

### Création d'équipe

```
1. User sur CreateTeamPage
   ↓
2. Remplit formulaire 3 étapes
   ↓
3. Soumission → createTeam(payload)
   ↓
4. Backend retourne TeamDto
   ↓
5. navigate(`/team/${team.id}/management`)
   ↓
6. TeamProvider charge la nouvelle équipe
```

---

## 🎯 Principes Architecturaux

### ✅ À Respecter

1. **Separation of Concerns**
   - UI components purs (pas de logique métier)
   - Hooks pour logique réutilisable
   - Contexts pour état global

2. **Single Source of Truth**
   - Team data dans TeamContext uniquement
   - User data dans AuthContext uniquement
   - Pas de duplication de state

3. **Unidirectional Data Flow**
   - Context → Hooks → Components
   - Pas de props drilling excessif

4. **Type Safety**
   - Tout typé avec TypeScript
   - Pas de `any` sauf cas exceptionnels
   - Types API séparés des types App

5. **Route Order Matters**
   - Routes spécifiques avant routes dynamiques
   - Toujours tester routing après modifications

---

### ❌ À Éviter

1. ❌ Dupliquer la logique de permissions dans les composants
2. ❌ Accéder directement à l'API depuis les composants
3. ❌ Mettre de la logique métier dans les layouts
4. ❌ Oublier de vérifier `isLoading` avant d'utiliser les données
5. ❌ Utiliser `useTeam()` hors d'un TeamProvider
6. ❌ Mélanger routes statiques et dynamiques dans le mauvais ordre

---

## 🚀 Points d'Extension Futurs

### Ajout d'une nouvelle page Team

1. Créer `src/pages/team/NewPage.tsx`
2. Ajouter route dans `AppRouter.tsx` sous `/team/:teamId`
3. Ajouter lien dans `TeamSidebar.tsx`
4. La page aura automatiquement accès à `useTeam()`

### Ajout d'une nouvelle feature

1. Créer `src/features/newfeature/`
2. Structure : `components/`, `hooks/`, `services/`
3. Créer pages dans `src/pages/newfeature/`
4. Ajouter routes dans `AppRouter.tsx`

### Ajout d'un nouveau Context

1. Créer dossier `src/contexts/newcontext/`
2. Créer Provider, Context, Types, Hook
3. Injecter Provider dans layout approprié
4. Utiliser via hook custom

---

**Date** : 15 Février 2026  
**Version** : 1.0.0

