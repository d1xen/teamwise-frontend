# 📊 TeamPage Premium - Données manquantes (Backend)

## ✅ Données actuellement disponibles

Via `TeamMember` dans `/api/teams/:id/members` :
- ✅ `steamId` - ID Steam du membre
- ✅ `nickname` - Pseudo Steam
- ✅ `avatarUrl` - Avatar Steam
- ✅ `role` - Rôle dans l'équipe (PLAYER, COACH, etc.)
- ✅ `isOwner` - Statut propriétaire
- ✅ `firstName` - Prénom (depuis profil)
- ✅ `lastName` - Nom (depuis profil)
- ✅ `email` - Email (depuis profil)

---

## ❌ Données manquantes pour TeamPage Premium

Pour afficher une vitrine pro type HLTV, il manque :

### 1. **Données personnelles des membres**
À ajouter dans `TeamMemberDto` :

```typescript
export type TeamMemberDto = {
  steamId: string;
  nickname: string;
  role: TeamRole;
  isOwner: boolean;
  avatarUrl?: string | null;
  
  // ⚠️ À AJOUTER
  firstName?: string | null;      // Déjà présent dans TeamMember context
  lastName?: string | null;       // Déjà présent dans TeamMember context
  email?: string | null;          // Déjà présent dans TeamMember context
  birthDate?: string | null;      // ❌ MANQUANT - Date de naissance
  countryCode?: string | null;    // ❌ MANQUANT - Code pays (FR, US, etc.)
  customUsername?: string | null; // ❌ MANQUANT - Pseudo custom
};
```

### 2. **Métadonnées de l'équipe**
À ajouter dans `TeamDto` :

```typescript
export type TeamDto = {
  id: number;
  name: string;
  tag?: string | null;
  game?: string | null;
  logoUrl?: string | null;
  hltvUrl?: string | null;
  faceitUrl?: string | null;
  twitterUrl?: string | null;
  
  // ⚠️ À AJOUTER
  createdAt?: string | null;  // ❌ MANQUANT - Date de création de l'équipe
  updatedAt?: string | null;  // ❌ MANQUANT - Dernière mise à jour
  description?: string | null; // ❌ MANQUANT - Description de l'équipe (optionnel)
  
  membership?: TeamMembershipDto;
};
```

---

## 🎯 Impact sur TeamPage Premium

### Avec les données actuelles ✅
- ✅ Pseudo + Avatar
- ✅ Nom complet (firstName + lastName)
- ✅ Rôle
- ✅ Badge Owner
- ✅ Stats équipe (nombre membres, players, staff)

### Avec les données manquantes 🚀
- 🚀 **Âge de chaque joueur** (via birthDate)
- 🚀 **Âge moyen de l'équipe** (calculé depuis tous les birthDate)
- 🚀 **Drapeau de nationalité** (via countryCode)
- 🚀 **Date de création de l'équipe** ("Established 2024")
- 🚀 **Pseudo custom** si différent du Steam

---

## 🛠️ Modifications Backend nécessaires

### 1. Endpoint `/api/teams/:id/members`
**Actuellement retourne:**
```json
{
  "steamId": "...",
  "nickname": "...",
  "role": "PLAYER",
  "isOwner": false,
  "avatarUrl": "..."
}
```

**Devrait retourner:**
```json
{
  "steamId": "...",
  "nickname": "...",
  "role": "PLAYER",
  "isOwner": false,
  "avatarUrl": "...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "birthDate": "1998-05-15",        // ⚠️ À AJOUTER
  "countryCode": "FR",              // ⚠️ À AJOUTER
  "customUsername": "JohnThePlayer" // ⚠️ À AJOUTER (optionnel)
}
```

### 2. Endpoint `/api/teams/:id`
**Actuellement retourne:**
```json
{
  "id": 42,
  "name": "Team Vitality",
  "tag": "VIT",
  "game": "CS2",
  "logoUrl": "...",
  "hltvUrl": "...",
  "faceitUrl": "...",
  "twitterUrl": "..."
}
```

**Devrait retourner:**
```json
{
  "id": 42,
  "name": "Team Vitality",
  "tag": "VIT",
  "game": "CS2",
  "logoUrl": "...",
  "hltvUrl": "...",
  "faceitUrl": "...",
  "twitterUrl": "...",
  "createdAt": "2024-01-15T10:30:00Z",  // ⚠️ À AJOUTER
  "updatedAt": "2026-02-15T12:00:00Z",  // ⚠️ À AJOUTER
  "description": "Team description..."   // ⚠️ À AJOUTER (optionnel)
}
```

---

## 📋 Checklist Backend

### Priorité HAUTE (pour TeamPage Premium)
- [ ] Ajouter `birthDate` dans la réponse `/api/teams/:id/members`
- [ ] Ajouter `countryCode` dans la réponse `/api/teams/:id/members`
- [ ] Ajouter `createdAt` dans la réponse `/api/teams/:id`

### Priorité MOYENNE
- [ ] Ajouter `customUsername` dans `/api/teams/:id/members`
- [ ] Ajouter `description` dans `/api/teams/:id`
- [ ] Ajouter `updatedAt` dans `/api/teams/:id`

---

## 🎨 Design actuel (avec données disponibles)

La TeamPage Premium affiche actuellement :

### Header Hero ✅
- Logo grande taille avec effet glow
- Nom + Tag de l'équipe
- Jeu pratiqué
- Stats rapides (membres, players, staff)
- Liens sociaux (HLTV, Faceit, Twitter)
- Bouton Settings (si permissions)

### Roster Players ✅
- Grid 2 colonnes (responsive)
- Avatar grande taille
- Pseudo en gros et visible
- Nom complet en secondaire
- Owner badge discret
- Rôle discret (si non-PLAYER)

### Staff Section ✅
- Grid 3 colonnes
- Avatar + Nom + Pseudo
- Role badge visible
- Owner crown

---

## 🚀 Design futur (avec données complètes)

Quand le backend sera enrichi :

### Roster Players 🚀
- Avatar avec drapeau de nationalité
- Âge affiché (23 ans)
- Nationalité visible
- Pseudo custom si disponible

### Team Stats 🚀
- Âge moyen de l'équipe (22.4 ans)
- Date de création ("Established Jan 2024")
- Dernière activité

---

## 📝 Notes pour le développeur Backend

Les données de profil existent déjà dans `UserProfile`, il suffit de les **joindre** dans la réponse `/api/teams/:id/members`.

**Requête SQL suggérée:**
```sql
SELECT 
  tm.steam_id,
  u.nickname,
  tm.role,
  tm.is_owner,
  u.avatar_url,
  -- Jointure avec profil
  up.first_name,
  up.last_name,
  up.email,
  up.birth_date,      -- ⚠️ À ajouter
  up.country_code,    -- ⚠️ À ajouter
  up.custom_username  -- ⚠️ À ajouter
FROM team_members tm
JOIN users u ON tm.steam_id = u.steam_id
LEFT JOIN user_profiles up ON u.steam_id = up.steam_id
WHERE tm.team_id = :teamId
```

---

**Date:** 16 février 2026  
**Auteur:** Frontend TeamWise  
**Statut:** En attente des modifications backend

