# 🔄 Synchronisation Frontend/Backend - TeamPage Premium

**Date:** 16 février 2026  
**Version:** Frontend v2.0 + Backend API v0 (mise à jour)

---

## ✅ CHANGEMENTS EFFECTUÉS

### 1. Mise à jour des types API (`/src/api/types/team.ts`)

#### **TeamDto** - Nouveaux champs ajoutés
```typescript
export type TeamDto = {
    // ... champs existants
    createdAt?: string | null;      // ISO 8601 date-time
    updatedAt?: string | null;      // ISO 8601 date-time
    description?: string | null;    // Description de l'équipe
};
```

#### **TeamMemberDto** - Nouveaux champs ajoutés
```typescript
export type TeamMemberDto = {
    // ... champs existants
    firstName?: string | null;
    lastName?: string | null;
    birthDate?: string | null;      // ISO 8601 date (YYYY-MM-DD)
    countryCode?: string | null;    // ISO 2 lettres (FR, US, GB...)
    customUsername?: string | null;
};
```

### 2. Mise à jour du contexte Team (`/src/contexts/team/TeamContext.tsx`)

Le mapping des données de l'API vers le contexte local a été enrichi :

#### **Team mapping**
```typescript
setTeam({
    // ... champs existants
    ...(teamData.createdAt && { createdAt: teamData.createdAt }),
    ...(teamData.updatedAt && { updatedAt: teamData.updatedAt }),
    ...(teamData.description && { description: teamData.description }),
});
```

#### **Members mapping**
```typescript
setMembers(
    membersData.map((m) => ({
        // ... champs existants
        ...(m.firstName && { firstName: m.firstName }),
        ...(m.lastName && { lastName: m.lastName }),
        ...(m.birthDate && { birthDate: m.birthDate }),
        ...(m.countryCode && { countryCode: m.countryCode }),
        ...(m.customUsername && { customUsername: m.customUsername }),
    }))
);
```

---

## 🎯 RÉSULTAT

### Données maintenant disponibles dans TeamPage

#### **Pour l'équipe** (via `team`)
- ✅ `createdAt` → Affichage "Established Feb 2024"
- ✅ `updatedAt` → Métadonnées disponibles
- ✅ `description` → Prêt pour future feature

#### **Pour chaque membre** (via `members`)
- ✅ `firstName` + `lastName` → Affichage du nom complet
- ✅ `birthDate` → Calcul de l'âge + âge moyen équipe
- ✅ `countryCode` → Affichage du drapeau 🇫🇷
- ✅ `customUsername` → Pseudo personnalisé (prioritaire sur nickname)

---

## 📊 AFFICHAGE TEAMPAGE PREMIUM

### Hero Header
```
[LOGO] TeamName          TAG
       CS2

       8 members  •  5 players  •  3 staff  •  22.4 avg age  •  Established Feb 2024
```

### Player Card (style HLTV)
```
┌─────────────────────────────────┐
│ [OWNER]                         │
│                                 │
│  [AVATAR 🇫🇷]  s1mple          │
│                 Oleksandr Kostyliev  │
│                 📅 26 years  📍 UA   │
└─────────────────────────────────┘
```

### Staff Card
```
┌─────────────────────┐
│ [AVATAR 👑] Coach   │
│             Alex    │
│             [COACH] │
└─────────────────────┘
```

---

## 🧪 TEST VALIDATION

### Backend doit retourner (exemple)

#### GET `/api/teams/42`
```json
{
  "id": 42,
  "name": "Natus Vincere",
  "tag": "NAVI",
  "game": "CS2",
  "logoUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2026-02-16T14:22:00Z",
  "description": "Ukrainian esports organization",
  "membership": { "role": "PLAYER", "isOwner": false }
}
```

#### GET `/api/teams/42/members`
```json
[
  {
    "steamId": "76561198012345678",
    "nickname": "s1mple",
    "avatarUrl": "https://...",
    "role": "PLAYER",
    "isOwner": true,
    "firstName": "Oleksandr",
    "lastName": "Kostyliev",
    "birthDate": "1997-10-02",
    "countryCode": "UA",
    "customUsername": "s1mple"
  }
]
```

---

## ✅ CHECKLIST DE VÉRIFICATION

### Backend (à confirmer)
- [x] Swagger mis à jour avec nouveaux champs
- [ ] Tester endpoint `/api/teams/{id}` → retourne `createdAt`, `updatedAt`, `description`
- [ ] Tester endpoint `/api/teams/{id}/members` → retourne `firstName`, `lastName`, `birthDate`, `countryCode`, `customUsername`

### Frontend
- [x] Types API mis à jour
- [x] Contexte Team mis à jour
- [x] TeamPage utilise les nouvelles données
- [x] Gestion gracieuse des données null/undefined
- [x] Build TypeScript OK

### Fonctionnel
- [ ] Ouvrir TeamPage dans le navigateur
- [ ] Vérifier que l'âge s'affiche (si birthDate fourni par backend)
- [ ] Vérifier que le nom complet s'affiche (si firstName/lastName fournis)
- [ ] Vérifier que le drapeau s'affiche (si countryCode fourni)
- [ ] Vérifier que "Established [date]" s'affiche (si createdAt fourni)

---

## 🐛 DEBUGGING

### Si les données ne s'affichent pas

#### 1. Vérifier la réponse API dans DevTools
```bash
# Ouvrir DevTools → Network
# Filtrer: /api/teams/
# Inspecter la réponse JSON
```

#### 2. Vérifier le console.log du contexte
```typescript
// Dans TeamContext.tsx, ajouter temporairement:
console.log('Team data:', teamData);
console.log('Members data:', membersData);
```

#### 3. Vérifier que les champs sont bien mappés
```typescript
// Dans TeamPage.tsx, ajouter:
console.log('Team createdAt:', team.createdAt);
console.log('First member:', members[0]);
```

### Si les champs sont null alors que backend les envoie

**Vérifier que le mapping dans `TeamContext.tsx` ne filtre pas les valeurs:**
```typescript
// ❌ Incorrect (filtre les valeurs)
...(teamData.createdAt && { createdAt: teamData.createdAt })

// ✅ Correct (garde même null)
createdAt: teamData.createdAt ?? null
```

**Note:** La syntaxe actuelle avec `&&` est volontaire pour ne pas ajouter les clés si la valeur est `null`/`undefined`. C'est le comportement souhaité.

---

## 📚 RÉFÉRENCES

### Fichiers modifiés
- `/src/api/types/team.ts` → Types API enrichis
- `/src/contexts/team/TeamContext.tsx` → Mapping enrichi
- `/docs/BACKEND_AUDIT_TEAMPAGE_PREMIUM.md` → Spécifications détaillées

### Fichiers utilisant les nouvelles données
- `/src/pages/team/TeamPage.tsx` → Affichage roster premium
- `/src/shared/utils/dateUtils.ts` → Calculs d'âge

### Backend (à confirmer)
- `TeamDto.java` → Doit contenir `createdAt`, `updatedAt`, `description`, `game`
- `TeamMemberDto.java` → Doit contenir `firstName`, `lastName`, `birthDate`, `countryCode`, `customUsername`

---

## 🎉 RÉSULTAT ATTENDU

Après ces changements, la **TeamPage** doit afficher :

✅ Nom complet des joueurs (si renseigné)  
✅ Âge de chaque joueur (si date de naissance renseignée)  
✅ Âge moyen de l'équipe (calculé dynamiquement)  
✅ Drapeau de nationalité (si countryCode renseigné)  
✅ Date de création de l'équipe "Established [date]"  
✅ Design ultra-premium style HLTV/Notion  

**Si un champ est `null`/`undefined`, il est simplement masqué (pas d'erreur, pas de "N/A").**

---

**Dernière mise à jour:** 16 février 2026  
**Status:** ✅ Frontend synchronisé avec Backend API v0

