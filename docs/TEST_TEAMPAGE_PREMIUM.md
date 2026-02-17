# 🧪 Guide de Test - TeamPage Premium

**Objectif:** Vérifier que les nouvelles données backend s'affichent correctement dans TeamPage.

---

## 🔍 ÉTAPE 1 : Vérifier la réponse Backend

### 1.1 Tester GET `/api/teams/{teamId}`

**Méthode:**
1. Ouvrir DevTools (F12)
2. Aller sur votre équipe : `http://localhost:5173/team/{teamId}`
3. Onglet **Network**
4. Filtrer : `teams`
5. Trouver la requête : `GET /api/teams/{id}`
6. Cliquer → **Response**

**Vérifier la présence de:**
```json
{
  "id": 42,
  "name": "Nom de l'équipe",
  "tag": "TAG",
  "game": "CS2",
  "createdAt": "2024-01-15T10:30:00Z",     // ← NOUVEAU
  "updatedAt": "2026-02-16T14:22:00Z",     // ← NOUVEAU
  "description": "Description...",          // ← NOUVEAU (peut être null)
  "membership": { ... }
}
```

### 1.2 Tester GET `/api/teams/{teamId}/members`

**Méthode:**
1. Même procédure
2. Trouver la requête : `GET /api/teams/{id}/members`
3. Cliquer → **Response**

**Vérifier la présence de:**
```json
[
  {
    "steamId": "76561198012345678",
    "nickname": "ProPlayer",
    "role": "PLAYER",
    "isOwner": true,
    "avatarUrl": "https://...",
    "firstName": "John",                  // ← NOUVEAU (peut être null)
    "lastName": "Doe",                    // ← NOUVEAU (peut être null)
    "birthDate": "1997-10-02",            // ← NOUVEAU (peut être null)
    "countryCode": "FR",                  // ← NOUVEAU (peut être null)
    "customUsername": "JohnTheKing"       // ← NOUVEAU (peut être null)
  }
]
```

---

## 👁️ ÉTAPE 2 : Vérifier l'affichage Frontend

### 2.1 Header de l'équipe (Hero)

**Attendu si `createdAt` est fourni:**
```
TeamName          TAG
CS2

8 members  •  5 players  •  3 staff  •  22.4 avg age  •  Established Feb 2024
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         ← DOIT APPARAÎTRE
```

**Si `createdAt` est null:**
```
TeamName          TAG
CS2

8 members  •  5 players  •  3 staff  •  22.4 avg age
                                         (pas de date)
```

### 2.2 Player Cards

**Attendu si données complètes:**
```
┌─────────────────────────────────────────┐
│ [OWNER]                                 │
│                                         │
│  [AVATAR 🇫🇷]  s1mple                  │
│                 Oleksandr Kostyliev     │  ← firstName + lastName
│                 📅 26 years  📍 FR      │  ← age + countryCode
└─────────────────────────────────────────┘
```

**Si données manquantes (null):**
```
┌─────────────────────────────────────────┐
│  [AVATAR]  s1mple                       │
│            (pas de nom complet)         │
│            (pas d'âge ni pays)          │
└─────────────────────────────────────────┘
```

**✅ COMPORTEMENT CORRECT:**
- Pas d'erreur
- Pas de "N/A"
- Juste masquage gracieux des données manquantes

### 2.3 Âge moyen de l'équipe

**Attendu si AU MOINS UN joueur a `birthDate`:**
```
22.4 avg age
^^^^
```

**Si AUCUN joueur n'a `birthDate`:**
```
(pas d'affichage de l'âge moyen)
```

---

## 🐛 ÉTAPE 3 : Debugging si problème

### 3.1 Les données ne s'affichent pas

#### Console Browser (F12 → Console)

**Ajouter temporairement dans TeamPage.tsx:**
```typescript
console.log('🔍 DEBUG Team:', team);
console.log('🔍 DEBUG Members:', members);
console.log('🔍 DEBUG First member:', members[0]);
```

**Vérifier:**
- `team.createdAt` → doit contenir une chaîne ISO 8601 ou `undefined`
- `members[0].firstName` → doit contenir une chaîne ou `undefined`
- `members[0].birthDate` → doit contenir "YYYY-MM-DD" ou `undefined`

#### Si les champs sont `undefined` alors que Backend les envoie

**Vérifier TeamContext.tsx ligne 48-75:**
```typescript
// Doit contenir:
...(teamData.createdAt && { createdAt: teamData.createdAt }),

// Doit contenir:
...(m.firstName && { firstName: m.firstName }),
...(m.birthDate && { birthDate: m.birthDate }),
```

### 3.2 Les dates ne se formatent pas

**Vérifier `/src/shared/utils/dateUtils.ts`:**
```typescript
// Test manuel dans console:
import { calculateAge, formatDateShort } from '@/shared/utils/dateUtils';

console.log(calculateAge('1997-10-02')); // Doit retourner un nombre (ex: 28)
console.log(formatDateShort('2024-01-15T10:30:00Z', 'fr')); // Doit retourner "janv. 2024"
```

### 3.3 Les drapeaux ne s'affichent pas

**Vérifier que `react-world-flags` est installé:**
```bash
npm list react-world-flags
```

**Si manquant:**
```bash
npm install react-world-flags
```

**Vérifier l'import dans TeamPage.tsx:**
```typescript
import Flag from 'react-world-flags';
```

---

## ✅ CHECKLIST DE VALIDATION FINALE

### Backend
- [ ] Endpoint `/api/teams/{id}` retourne `createdAt`, `updatedAt`, `description`, `game`
- [ ] Endpoint `/api/teams/{id}/members` retourne `firstName`, `lastName`, `birthDate`, `countryCode`, `customUsername`
- [ ] Les champs sont bien de type nullable (ne plantent pas si non renseignés)

### Frontend
- [x] Types TypeScript mis à jour
- [x] Contexte Team mappe les nouvelles données
- [x] TeamPage affiche les données si disponibles
- [x] TeamPage masque gracieusement si données manquantes
- [x] Build compile sans erreur

### Affichage
- [ ] Date création équipe s'affiche (si `createdAt` fourni)
- [ ] Nom complet joueur s'affiche (si `firstName`/`lastName` fournis)
- [ ] Âge joueur s'affiche (si `birthDate` fourni)
- [ ] Âge moyen équipe s'affiche (si au moins 1 joueur a `birthDate`)
- [ ] Drapeau pays s'affiche (si `countryCode` fourni)
- [ ] Aucune erreur console
- [ ] Aucun "undefined" visible à l'écran

---

## 📸 CAPTURES D'ÉCRAN ATTENDUES

### Cas 1 : Données complètes
![TeamPage avec toutes les données](capture-full-data.png)
- Tous les champs affichés
- Aspect ultra-professionnel
- Comme HLTV

### Cas 2 : Données partielles (certains joueurs sans date naissance)
![TeamPage avec données partielles](capture-partial-data.png)
- Certaines cartes affichent l'âge, d'autres non
- Pas d'erreur
- Design cohérent

### Cas 3 : Équipe nouvellement créée (aucun profil complété)
![TeamPage sans données enrichies](capture-minimal-data.png)
- Affichage minimaliste
- Pseudo + Avatar uniquement
- Pas d'âge moyen affiché
- Pas de date création (si backend ne l'envoie pas encore)

---

## 🎯 RÉSULTAT ATTENDU

**TeamPage doit être:**
- ✅ Ultra-professionnelle visuellement
- ✅ Robuste (pas de crash si données manquantes)
- ✅ Élégante (masquage gracieux, pas de "N/A")
- ✅ Performante (pas de requêtes multiples)
- ✅ Type-safe (TypeScript strict OK)

**Si vous voyez tous les ✅ ci-dessus = SUCCESS 🎉**

---

**Dernière mise à jour:** 16 février 2026  
**Version:** Frontend v2.0 + Backend API v0

