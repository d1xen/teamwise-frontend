# 🔍 AUDIT BACKEND - TeamPage Premium Enhancement

**Date:** 16 février 2026  
**Frontend Version:** v2.0 (Premium Design System)  
**Backend Target:** API v0 (OpenAPI 3.1.0)

---

## 📋 EXECUTIVE SUMMARY

Le frontend TeamWise a été entièrement refondu avec un design system premium type **Notion/Linear/HLTV**. La page **TeamPage** est maintenant une vitrine ultra-professionnelle du roster d'équipe, inspirée des meilleurs SaaS esports.

**Problème actuel:** Les endpoints backend ne fournissent pas toutes les données nécessaires pour afficher une page Team complète et professionnelle.

**Objectif:** Enrichir les endpoints existants pour supporter l'affichage premium sans casser la compatibilité.

---

## 🎯 DONNÉES MANQUANTES CRITIQUES

### 1. **Endpoint `/api/teams/{teamId}/members` - Enrichissement TeamMemberDto**

#### État actuel (Swagger)
```typescript
TeamMemberDto {
    steamId: string;
    nickname: string;
    role: TeamRole;
    isOwner: boolean;
    avatarUrl?: string | null;
}
```

#### Données manquantes pour TeamPage Premium
Le frontend a besoin de :

| Champ | Type | Obligatoire | Utilisation Frontend | Déjà dans UserProfile? |
|-------|------|-------------|---------------------|------------------------|
| `firstName` | `string \| null` | ❌ Non | Afficher nom complet sous pseudo | ✅ Oui |
| `lastName` | `string \| null` | ❌ Non | Afficher nom complet sous pseudo | ✅ Oui |
| `birthDate` | `string \| null` (ISO 8601) | ❌ Non | Calculer âge joueur + âge moyen équipe | ✅ Oui |
| `countryCode` | `string \| null` (ISO 2 lettres) | ❌ Non | Afficher drapeau + nationalité | ✅ Oui |
| `customUsername` | `string \| null` | ❌ Non | Pseudo personnalisé (fallback sur nickname) | ✅ Oui |

**Note importante:** Ces données existent **déjà dans UserProfile** (`/api/users/{steamId}/profile`). 

### 2. **Endpoint `/api/teams/{teamId}` - Enrichissement TeamDto**

#### État actuel (Swagger)
```typescript
TeamDto {
    id: number;
    name: string;
    tag?: string | null;
    logoUrl?: string | null;
    twitterUrl?: string | null;
    faceitUrl?: string | null;
    hltvUrl?: string | null;
    membership?: Membership;
}
```

#### Données manquantes pour TeamPage Premium

| Champ | Type | Obligatoire | Utilisation Frontend | Existe en DB? |
|-------|------|-------------|---------------------|---------------|
| `createdAt` | `string` (ISO 8601) | ✅ Oui | "Established 2024" style HLTV | ✅ Probablement (entité JPA) |
| `updatedAt` | `string` (ISO 8601) | ❌ Non | Metadata (optionnel) | ✅ Probablement (entité JPA) |
| `description` | `string \| null` | ❌ Non | Texte de présentation équipe | ❌ À créer |
| `game` | `string \| null` | ❌ Non | Jeu principal (CS2, Valorant...) | ❓ À vérifier |

**Note:** `createdAt` existe probablement déjà en base (annotation `@CreatedDate` JPA), il suffit de l'exposer dans le DTO.

---

## 🔧 SOLUTIONS PROPOSÉES

### Solution 1 (RECOMMANDÉE) : Enrichir TeamMemberDto avec jointure UserProfile

**Backend:** Modifier le mapper `TeamMemberDto` pour inclure les données de profil.

#### Avant (actuel)
```java
public TeamMemberDto toTeamMemberDto(TeamMembership membership) {
    return TeamMemberDto.builder()
        .steamId(membership.getUser().getSteamId())
        .nickname(membership.getUser().getNickname())
        .avatarUrl(membership.getUser().getAvatarUrl())
        .role(membership.getRole())
        .isOwner(membership.isOwner())
        .build();
}
```

#### Après (enrichi)
```java
public TeamMemberDto toTeamMemberDto(TeamMembership membership) {
    UserProfile profile = membership.getUser().getProfile(); // Jointure
    
    return TeamMemberDto.builder()
        .steamId(membership.getUser().getSteamId())
        .nickname(membership.getUser().getNickname())
        .avatarUrl(membership.getUser().getAvatarUrl())
        .role(membership.getRole())
        .isOwner(membership.isOwner())
        // Enrichissement profil
        .firstName(profile != null ? profile.getFirstName() : null)
        .lastName(profile != null ? profile.getLastName() : null)
        .birthDate(profile != null ? profile.getBirthDate() : null)
        .countryCode(profile != null ? profile.getCountryCode() : null)
        .customUsername(profile != null ? profile.getCustomUsername() : null)
        .build();
}
```

#### DTO mis à jour
```java
@Data
@Builder
public class TeamMemberDto {
    private String steamId;
    private String nickname;
    private String avatarUrl;
    private TeamRole role;
    private boolean isOwner;
    
    // Nouveaux champs (optionnels - nullable)
    private String firstName;
    private String lastName;
    private LocalDate birthDate; // Sérialisé ISO 8601
    private String countryCode;  // Code ISO 2 lettres (FR, US, GB...)
    private String customUsername;
}
```

**Avantages:**
- ✅ Aucun nouvel endpoint
- ✅ Pas de N+1 queries (jointure propre)
- ✅ Rétrocompatible (champs optionnels)
- ✅ Réutilise données existantes
- ✅ Une seule requête pour tout le roster

**Performance:**
```sql
-- Jointure optimale à mettre en cache
SELECT tm.*, up.first_name, up.last_name, up.birth_date, up.country_code, up.custom_username
FROM team_memberships tm
LEFT JOIN user_profiles up ON tm.user_steam_id = up.steam_id
WHERE tm.team_id = ?
```

---

### Solution 2 : Enrichir TeamDto avec métadonnées

**Backend:** Ajouter `createdAt`, `updatedAt`, `description`, `game` dans TeamDto.

#### DTO mis à jour
```java
@Data
@Builder
public class TeamDto {
    private Long id;
    private String name;
    private String tag;
    private String logoUrl;
    private String twitterUrl;
    private String faceitUrl;
    private String hltvUrl;
    private Membership membership;
    
    // Nouveaux champs
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private Instant createdAt;      // Déjà en base (@CreatedDate)
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private Instant updatedAt;      // Déjà en base (@LastModifiedDate)
    
    private String description;     // Nouveau champ à ajouter en DB
    private String game;            // À vérifier si existe
}
```

**Migration SQL requise (si description n'existe pas):**
```sql
ALTER TABLE teams 
ADD COLUMN description VARCHAR(500) NULL,
ADD COLUMN game VARCHAR(50) NULL DEFAULT 'CS2';
```

**Avantages:**
- ✅ Données essentielles pour page vitrine
- ✅ `createdAt`/`updatedAt` déjà en base (JPA)
- ✅ Rétrocompatible (champs optionnels)
- ✅ Scalable pour futures features

---

## 📊 IMPACT FRONTEND

### Actuellement implémenté (avec données mock/nullables)

#### 1. TeamPage.tsx - Calculs basés sur données enrichies
```typescript
// Âge moyen des joueurs (calculé côté front)
const averageAge = calculateAverageAge(playerMembers);

// Date de création formatée
const createdDate = team.createdAt 
  ? formatDateShort(team.createdAt, locale) 
  : null;
```

#### 2. PlayerCard - Affichage conditionnel élégant
```typescript
// ✅ Gère gracieusement les données manquantes
{member.firstName || member.lastName ? (
  <p className="text-sm text-neutral-400">
    {member.firstName} {member.lastName}
  </p>
) : null}

{calculateAge(member.birthDate) ? (
  <span>{age} ans</span>
) : null}

{member.countryCode && (
  <Flag code={member.countryCode} className="w-6 h-4" />
)}
```

### Ce qui sera amélioré avec les données backend

| Feature | Avant | Après |
|---------|-------|-------|
| Nom complet joueur | ❌ Vide | ✅ "John Doe" |
| Âge joueur | ❌ Caché | ✅ "23 ans" |
| Âge moyen équipe | ❌ Caché | ✅ "22.4 ans" |
| Drapeau nationalité | ❌ Caché | ✅ 🇫🇷 Flag affiché |
| Date création équipe | ❌ Caché | ✅ "Established Feb 2024" |
| Pseudo custom | ❌ Steam nickname | ✅ Pseudo choisi |

---

## 🛡️ GARANTIES RÉTROCOMPATIBILITÉ

### Tous les nouveaux champs sont **optionnels (nullable)**

**Ancien client (sans ces champs):**
```json
{
  "steamId": "76561198012345678",
  "nickname": "ProPlayer",
  "role": "PLAYER",
  "isOwner": false
}
```
✅ Continue de fonctionner

**Nouveau client (avec champs enrichis):**
```json
{
  "steamId": "76561198012345678",
  "nickname": "ProPlayer",
  "role": "PLAYER",
  "isOwner": false,
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "2001-05-15",
  "countryCode": "FR",
  "customUsername": "JohnDGOAT"
}
```
✅ Exploite les données premium

---

## 📋 CHECKLIST IMPLÉMENTATION BACKEND

### Phase 1 : Enrichir TeamMemberDto (PRIORITAIRE)

- [ ] **1.1** Modifier `TeamMemberDto.java`
  - [ ] Ajouter champs: `firstName`, `lastName`, `birthDate`, `countryCode`, `customUsername`
  - [ ] Tous les champs nullable (compatibilité)
  
- [ ] **1.2** Modifier mapper `toTeamMemberDto()`
  - [ ] Jointure `UserProfile` via `TeamMembership.user.profile`
  - [ ] Mapper les 5 nouveaux champs
  - [ ] Gérer cas `profile == null`
  
- [ ] **1.3** Optimiser requête
  - [ ] Ajouter `@EntityGraph` ou `JOIN FETCH` pour éviter N+1
  - [ ] Tester performance avec équipe de 10+ membres
  
- [ ] **1.4** Tests
  - [ ] Test unitaire mapper
  - [ ] Test endpoint `/api/teams/{id}/members`
  - [ ] Vérifier sérialisation JSON correcte
  - [ ] Tester avec profil incomplet (champs null)

### Phase 2 : Enrichir TeamDto (SECONDAIRE)

- [ ] **2.1** Vérifier entité `Team.java`
  - [ ] Confirmer présence `@CreatedDate createdAt`
  - [ ] Confirmer présence `@LastModifiedDate updatedAt`
  - [ ] Vérifier si `game` existe déjà
  
- [ ] **2.2** Migration SQL (si nécessaire)
  - [ ] Ajouter colonne `description VARCHAR(500) NULL`
  - [ ] Ajouter colonne `game VARCHAR(50) NULL`
  
- [ ] **2.3** Modifier `TeamDto.java`
  - [ ] Ajouter `createdAt`, `updatedAt`, `description`, `game`
  - [ ] Configurer `@JsonFormat` pour dates ISO
  
- [ ] **2.4** Modifier mapper `toTeamDto()`
  - [ ] Mapper nouveaux champs depuis entité
  
- [ ] **2.5** Tests
  - [ ] Test endpoint `/api/teams/{id}`
  - [ ] Vérifier format ISO 8601 dates
  - [ ] Tester avec team sans description

### Phase 3 : Documentation & Déploiement

- [ ] **3.1** Mettre à jour Swagger/OpenAPI
  - [ ] Documenter nouveaux champs TeamMemberDto
  - [ ] Documenter nouveaux champs TeamDto
  - [ ] Préciser que champs sont optionnels
  
- [ ] **3.2** Changelog API
  - [ ] Documenter breaking changes (aucun normalement)
  - [ ] Expliquer nouveaux champs
  
- [ ] **3.3** Tests d'intégration
  - [ ] Tester avec frontend en local
  - [ ] Vérifier affichage TeamPage complète
  - [ ] Tester cas limites (profils incomplets)

---

## 🎯 RÉSULTAT ATTENDU

### Exemple réponse `/api/teams/42/members` (après implémentation)

```json
[
  {
    "steamId": "76561198012345678",
    "nickname": "s1mple",
    "avatarUrl": "https://avatars.steamstatic.com/...",
    "role": "PLAYER",
    "isOwner": true,
    "firstName": "Oleksandr",
    "lastName": "Kostyliev",
    "birthDate": "1997-10-02",
    "countryCode": "UA",
    "customUsername": "s1mple"
  },
  {
    "steamId": "76561198087654321",
    "nickname": "ZywOo",
    "avatarUrl": "https://avatars.steamstatic.com/...",
    "role": "PLAYER",
    "isOwner": false,
    "firstName": "Mathieu",
    "lastName": "Herbaut",
    "birthDate": "2000-11-09",
    "countryCode": "FR",
    "customUsername": "ZywOo"
  },
  {
    "steamId": "76561198000000000",
    "nickname": "Coach_ALEX",
    "avatarUrl": "https://avatars.steamstatic.com/...",
    "role": "COACH",
    "isOwner": false,
    "firstName": null,
    "lastName": null,
    "birthDate": null,
    "countryCode": null,
    "customUsername": null
  }
]
```

### Exemple réponse `/api/teams/42` (après implémentation)

```json
{
  "id": 42,
  "name": "Natus Vincere",
  "tag": "NAVI",
  "logoUrl": "https://...",
  "hltvUrl": "https://www.hltv.org/team/4608/natus-vincere",
  "faceitUrl": "https://www.faceit.com/en/teams/...",
  "twitterUrl": "https://twitter.com/natusvincere",
  "membership": {
    "role": "PLAYER",
    "isOwner": false
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2026-02-16T14:22:00Z",
  "description": "Ukrainian esports organization founded in 2009",
  "game": "CS2"
}
```

---

## 💡 RECOMMANDATIONS TECHNIQUES

### Performance
1. **Jointure optimale** pour `/api/teams/{id}/members`:
   ```java
   @Query("SELECT tm FROM TeamMembership tm " +
          "LEFT JOIN FETCH tm.user u " +
          "LEFT JOIN FETCH u.profile " +
          "WHERE tm.team.id = :teamId")
   List<TeamMembership> findByTeamIdWithProfiles(@Param("teamId") Long teamId);
   ```

2. **Cache** recommandé (Spring Cache):
   ```java
   @Cacheable(value = "teamMembers", key = "#teamId")
   public List<TeamMemberDto> getMembers(Long teamId) { ... }
   ```

### Sécurité
- ✅ Pas de données sensibles exposées
- ✅ `birthDate` → calcul âge fait côté front (pas d'exposition date exacte publique)
- ✅ `countryCode` → donnée publique OK
- ⚠️ Vérifier que `email`, `phone`, `address` ne sont **jamais** exposés via ce endpoint

### Validation
```java
@Data
@Builder
public class TeamMemberDto {
    // ... existing fields
    
    @Size(max = 50)
    private String firstName;
    
    @Size(max = 50)
    private String lastName;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;
    
    @Pattern(regexp = "^[A-Z]{2}$")
    private String countryCode;
    
    @Size(max = 20)
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$")
    private String customUsername;
}
```

---

## 🚀 PRIORITÉS

### Must Have (Phase 1) - Bloquant pour production
- ✅ **TeamMemberDto enrichi** (firstName, lastName, birthDate, countryCode)
  - Impact direct sur UX TeamPage
  - Données déjà disponibles en DB
  - Implémentation rapide (~2h)

### Should Have (Phase 2) - Important mais non bloquant
- ⭐ **TeamDto.createdAt** (date création équipe)
  - Donnée probablement déjà en base
  - Juste à exposer dans DTO
  - Implémentation rapide (~30min)

### Nice to Have (Phase 3) - Future enhancement
- 🎯 **TeamDto.description** (présentation équipe)
  - Nécessite migration SQL
  - Feature future (pas urgente)
  - Implémentation ~1h

---

## 📞 CONTACT & QUESTIONS

### Points à clarifier avec le backend

1. **Entité Team:** 
   - `createdAt` existe déjà ? (probablement oui si `@CreatedDate`)
   - `game` existe déjà ? (à vérifier)
   
2. **Performance:**
   - Quelle stratégie de cache actuellement ?
   - N+1 queries déjà géré sur membres ?
   
3. **Migration:**
   - Process de migration pour `description` ?
   - Liquibase/Flyway utilisé ?

---

## 📚 RÉFÉRENCES

### Frontend
- **TeamPage.tsx:** `/src/pages/team/TeamPage.tsx` (387 lignes)
- **Types:** `/src/contexts/team/team.types.ts`
- **Utils:** `/src/shared/utils/dateUtils.ts`

### Backend (à vérifier)
- **Controller:** `TeamController.java` - endpoint `/api/teams/{id}/members`
- **DTO:** `TeamMemberDto.java`, `TeamDto.java`
- **Mapper:** Service de mapping entité → DTO
- **Entity:** `Team.java`, `TeamMembership.java`, `UserProfile.java`

### Documentation
- **Swagger actuel:** API v0 (fourni)
- **Contrat UX:** `contrat-ux-teampage-management-v1.1.md`
- **Changelog dev:** `docs/DEVELOPMENT_SESSIONS.md`

---

## ✅ VALIDATION

### Critères de succès

**Backend:**
- [ ] Endpoint `/api/teams/{id}/members` retourne les 5 nouveaux champs
- [ ] Endpoint `/api/teams/{id}` retourne `createdAt`
- [ ] Aucune régression sur endpoints existants
- [ ] Tests unitaires OK
- [ ] Performance acceptable (<100ms pour roster 10 joueurs)

**Frontend:**
- [ ] TeamPage affiche noms complets joueurs
- [ ] TeamPage affiche âges + âge moyen
- [ ] TeamPage affiche drapeaux nationalités
- [ ] TeamPage affiche "Established [date]"
- [ ] Gestion gracieuse si données manquantes (null)

**Intégration:**
- [ ] Build frontend OK
- [ ] Build backend OK
- [ ] Tests E2E OK
- [ ] Swagger mis à jour

---

**Préparé par:** Frontend Team (Clément)  
**Pour:** Backend Team  
**Date:** 16 février 2026  
**Version:** 1.0

