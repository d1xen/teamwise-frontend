# 📜 CONTRAT UX DÉFINITIF – MODULE TEAM
## TeamPage ↔ ManagementPage

**Date** : 15 février 2026  
**Version** : 1.1 - Séparation role/isOwner  
**Statut** : ✅ Validé pour implémentation  
**Changelog** : Clarification distinction role vs isOwner

---

## 📋 TABLE DES MATIÈRES

1. [Principe fondamental](#1-principe-fondamental)
2. [Contrat TeamPage](#2-contrat-teampage)
3. [Contrat ManagementPage](#3-contrat-managementpage)
4. [Matrice permissions par rôle](#4-matrice-permissions-par-rôle)
5. [Structure ManagementPage finale](#5-structure-managementpage-finale)
6. [États visuels par rôle](#6-états-visuels-par-rôle)
7. [Règles absolues](#7-règles-absolues)

---

## 1. PRINCIPE FONDAMENTAL

### 🎯 Séparation stricte

```
TeamPage        = CONSULTATION PURE (lecture seule)
ManagementPage  = ADMINISTRATION (actions + édition)
```

### ⚖️ Règle d'or

**"Si c'est une action d'édition ou de gestion, elle est UNIQUEMENT dans ManagementPage"**

- ❌ Aucune édition sur TeamPage
- ❌ Aucune duplication logique
- ✅ TeamPage = vitrine publique
- ✅ ManagementPage = backoffice

---

### 🆕 **DISTINCTION ROLE vs IOWNER** (v1.1)

#### **🔷 role (fonction dans l'équipe)**

**Définition :**
- Responsabilité fonctionnelle du membre dans l'équipe
- Valeurs possibles : `PLAYER`, `COACH`, `ANALYST`, `MANAGER`
- **Modifiable** par Owner ou Manager
- **Multiple** : Plusieurs membres peuvent avoir le même role
- **Impact** : Détermine certaines permissions fonctionnelles

**Exemples :**
```
John    → role: PLAYER
Sarah   → role: MANAGER
Mike    → role: COACH
Alice   → role: ANALYST
```

---

#### **👑 isOwner (propriété administrative)**

**Définition :**
- Statut de propriété administrative de l'équipe
- Valeurs possibles : `true` ou `false`
- **Non modifiable via ChangeRoleModal** : Nécessite action "Transfer ownership"
- **Unique** : Un seul membre peut avoir isOwner = true à la fois
- **Impact** : Détermine les permissions administratives maximales

**Exemples :**
```
John    → isOwner: true,  role: PLAYER     (Owner avec role Player)
Sarah   → isOwner: false, role: MANAGER    (Manager, pas Owner)
Mike    → isOwner: false, role: COACH      (Coach, pas Owner)
```

---

#### **🔗 Relation entre role et isOwner**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  isOwner = true                isOwner = false         │
│  ↓                             ↓                        │
│  PROPRIÉTÉ ADMINISTRATIVE      PAS DE PROPRIÉTÉ        │
│                                                         │
│  ┌─────────────────────┐      ┌─────────────────────┐ │
│  │ Peut avoir :        │      │ Peut avoir :        │ │
│  │ • role: PLAYER      │      │ • role: PLAYER      │ │
│  │ • role: COACH       │      │ • role: COACH       │ │
│  │ • role: ANALYST     │      │ • role: ANALYST     │ │
│  │ • role: MANAGER     │      │ • role: MANAGER     │ │
│  └─────────────────────┘      └─────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Principe :**
- `isOwner` et `role` sont **deux dimensions indépendantes**
- `isOwner` = statut administratif (qui possède l'équipe)
- `role` = fonction opérationnelle (que fait le membre dans l'équipe)

---

#### **📊 Exemples de combinaisons valides**

| Membre | isOwner | role | Description |
|--------|---------|------|-------------|
| John | `true` | `PLAYER` | Propriétaire qui joue aussi |
| Sarah | `false` | `MANAGER` | Manager non propriétaire |
| Mike | `true` | `MANAGER` | Propriétaire avec role Manager |
| Alice | `false` | `COACH` | Coach non propriétaire |
| Bob | `true` | `COACH` | Propriétaire avec role Coach |

**Tous ces cas sont valides et doivent être gérés.**

---

#### **⚠️ Clarifications critiques**

##### **1. Owner n'est PAS un role**

❌ **FAUX :**
```typescript
role: "OWNER"  // N'existe pas !
```

✅ **VRAI :**
```typescript
isOwner: true
role: "PLAYER" | "COACH" | "ANALYST" | "MANAGER"
```

##### **2. Changer le role ≠ Transférer la propriété**

**Exemple :**
```
John : isOwner = true, role = MANAGER

Manager Sarah peut :
✅ Changer le role de John → PLAYER
   Résultat : John devient isOwner = true, role = PLAYER

Manager Sarah ne peut pas :
❌ Transférer la propriété à quelqu'un d'autre
   isOwner reste à John
```

##### **3. Player peut être Owner**

**Exemple :**
```
John : isOwner = true, role = PLAYER

John a accès à :
✅ Toutes les permissions Owner (éditer équipe, invitations, exclusions)
✅ Badge "OWNER" affiché
✅ Peut transférer sa propriété
✅ Ne peut pas quitter l'équipe sans transférer avant
```

---

## 2. CONTRAT TEAMPAGE

### 🎯 Rôle de la page

**Page de consultation publique de l'équipe**

- Affichage informations équipe
- Affichage liste membres (Staff + Players)
- Aucune action d'édition
- Aucune logique de permissions

### 📊 Contenu visible (TOUS LES MEMBRES)

#### **Header Équipe**
| Élément | Visible | Éditable | Notes |
|---------|---------|----------|-------|
| Logo équipe | ✅ Tous | ❌ Jamais | Image statique |
| Nom équipe | ✅ Tous | ❌ Jamais | Texte statique |
| Statistiques (nb membres, players, staff) | ✅ Tous | ❌ Jamais | Calcul automatique |
| ID équipe | ✅ Tous | ❌ Jamais | Texte statique |

#### **Section Staff**
| Élément | Visible | Éditable | Notes |
|---------|---------|----------|-------|
| Titre "STAFF (N)" | ✅ Tous | ❌ Jamais | Nombre calculé |
| Grid de MemberCard | ✅ Tous | ❌ Jamais | Affichage lecture seule |
| Avatar membre | ✅ Tous | ❌ Jamais | Image statique |
| Pseudo membre | ✅ Tous | ❌ Jamais | Texte statique |
| Rôle membre | ✅ Tous | ❌ Jamais | Badge lecture seule |
| Badge "Owner" | ✅ Tous (si isOwner = true) | ❌ Jamais | Badge lecture seule |

#### **Section Players**
| Élément | Visible | Éditable | Notes |
|---------|---------|----------|-------|
| (identique Section Staff) | ✅ Tous | ❌ Jamais | Même structure |

### ❌ CE QUI N'EXISTE PAS sur TeamPage

| Élément | Raison |
|---------|--------|
| Boutons édition | Aucune édition possible |
| Menu actions (⋮) | Aucune action possible |
| Formulaires | Aucune modification possible |
| Boutons "Edit team" | Redirection vers ManagementPage |
| Boutons "Manage invitations" | Redirection vers ManagementPage |
| Modals d'édition | Aucune édition possible |
| États hover actions | Aucune action possible |
| Sélection membre | Pas de panel édition |

### ✅ CE QUI EXISTE sur TeamPage (conditionnel)

**Boutons de navigation (isOwner = true OU role = MANAGER) :**

| Bouton | Visible pour | Action | Position |
|--------|--------------|--------|----------|
| `[Go to Management]` | isOwner = true OU role = MANAGER | Redirige vers ManagementPage | Header équipe |

**Clarification :**
- Ces boutons ne sont **PAS des actions d'édition**
- Ce sont des **liens de navigation**
- Ils redirigent vers ManagementPage où les actions sont possibles

### 📐 Structure finale TeamPage

```
┌────────────────────────────────────────────────────────┐
│ TEAMPAGE (Consultation uniquement)                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ HEADER ÉQUIPE                                 │    │
│  │                                                │    │
│  │ [Logo]  Team Name                             │    │
│  │         8 membres • 5 players • 3 staff       │    │
│  │         ID: 42                                │    │
│  │                                                │    │
│  │ [Go to Management] ← isOwner OR role=MANAGER  │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  ════════════════════════════════════════════════      │
│  STAFF (3)                                              │
│  ════════════════════════════════════════════════      │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ Card    │  │ Card    │  │ Card    │                │
│  │ Manager │  │ Coach   │  │ Analyst │                │
│  │         │  │         │  │         │                │
│  │ (Hover: │  │         │  │         │                │
│  │  RIEN)  │  │         │  │         │                │
│  └─────────┘  └─────────┘  └─────────┘                │
│                                                         │
│  ════════════════════════════════════════════════      │
│  PLAYERS (5)                                            │
│  ════════════════════════════════════════════════      │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ Card    │  │ Card    │  │ Card    │                │
│  └─────────┘  └─────────┘  └─────────┘                │
│  ┌─────────┐  ┌─────────┐                              │
│  │ Card    │  │ Card    │                              │
│  └─────────┘  └─────────┘                              │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 🚫 Règles strictes TeamPage

1. **Aucune action d'édition** : Pas de boutons edit, pas de formulaires
2. **Aucune logique de permissions** : Pas de vérification canEdit/canKick/etc.
3. **Aucune modal d'édition** : TeamProfileModal et MemberProfileModal supprimées
4. **Aucun menu actions** : Pas de menu ⋮, pas d'actions au hover
5. **Aucune sélection** : Pas de clic pour éditer
6. **Navigation uniquement** : Bouton unique "Go to Management" (isOwner OR role=MANAGER)

---

## 3. CONTRAT MANAGEMENTPAGE

### 🎯 Rôle de la page

**Page d'administration de l'équipe**

- Édition informations équipe
- Gestion membres (profils, rôles, exclusions)
- Gestion invitations (isOwner uniquement)
- Permissions strictes par rôle ET isOwner

---

### 🆕 **MATRICE PERMISSIONS v1.1** (role + isOwner)

#### **Logique de calcul des permissions**

```typescript
Permissions = f(isOwner, role, targetMember)

Exemple :
canEditTeam = isOwner OR role === "MANAGER"
canInvite = isOwner
canKickMember = (isOwner OR role === "MANAGER") AND targetMember.isOwner === false
```

---

### 📊 Comportement par profil

#### **👑 OWNER (isOwner = true, any role)**

**Accès complet à toutes les fonctionnalités, indépendamment du role**

| Zone | Visible | Éditable | Actions possibles |
|------|---------|----------|-------------------|
| **Header** | ✅ | - | Badge "OWNER" + Badge role |
| **Zone Team Information** | ✅ | ✅ | Modifier nom, tag, logo, liens |
| **Zone Invitations** | ✅ | ✅ | Générer lien, copier, régénérer |
| **Zone Members** | ✅ | ✅ | Toutes actions sur tous membres |

**Actions membres disponibles :**
- ✅ Voir profil complet (tous)
- ✅ Éditer profil (tous)
- ✅ Changer role (tous, y compris soi-même)
- ✅ Transférer propriété (isOwner → autre membre)
- ✅ Exclure membre (tous sauf soi-même tant que isOwner = true)
- ✅ Éditer son propre profil
- ❌ Quitter équipe (doit transférer isOwner avant)

**Exemples concrets :**

**Cas 1 : Owner Player**
```
John: isOwner = true, role = PLAYER

Accès :
✅ Éditer équipe (nom, logo)
✅ Générer invitations
✅ Changer role de tous (y compris soi-même)
✅ Transférer sa propriété à Sarah
✅ Exclure n'importe qui (sauf lui-même)
❌ Quitter équipe sans transférer isOwner
```

**Cas 2 : Owner Manager**
```
Sarah: isOwner = true, role = MANAGER

Accès :
✅ Toutes les permissions Owner (identiques au cas 1)
✅ Le role MANAGER n'ajoute rien (Owner a déjà tout)
```

---

#### **🔧 MANAGER (isOwner = false, role = MANAGER)**

**Accès administration équipe + membres, SANS invitations**

| Zone | Visible | Éditable | Actions possibles |
|------|---------|----------|-------------------|
| **Header** | ✅ | - | Badge "MANAGER" uniquement |
| **Zone Team Information** | ✅ | ✅ | Modifier nom, tag, logo, liens |
| **Zone Invitations** | ❌ | ❌ | Section complètement cachée |
| **Zone Members** | ✅ | ✅ Partiel | Actions sur membres (sauf Owner) |

**Actions membres disponibles :**
- ✅ Voir profil complet (tous membres)
- ✅ Éditer profil (tous membres, y compris Owner)
- ✅ Changer role (tous membres, y compris Owner)
- ❌ Transférer propriété (réservé isOwner = true)
- ✅ Exclure membre (tous sauf isOwner = true)
- ✅ Éditer son propre profil
- ✅ Quitter équipe

**Exemples concrets :**

**Cas 1 : Manager modifiant un Owner Player**
```
Sarah: isOwner = false, role = MANAGER
John:  isOwner = true,  role = PLAYER

Sarah peut :
✅ Voir le profil de John
✅ Éditer le profil de John (nom, email, etc.)
✅ Changer le role de John (PLAYER → COACH, MANAGER, etc.)
❌ Transférer la propriété de John à quelqu'un d'autre
❌ Exclure John (car John.isOwner = true)
```

**Cas 2 : Manager modifiant un autre Manager**
```
Sarah: isOwner = false, role = MANAGER
Mike:  isOwner = false, role = MANAGER

Sarah peut :
✅ Voir le profil de Mike
✅ Éditer le profil de Mike
✅ Changer le role de Mike (MANAGER → PLAYER, etc.)
✅ Exclure Mike (car Mike.isOwner = false)
```

---

#### **🎮 PLAYER / COACH / ANALYST (isOwner = false, role ≠ MANAGER)**

**Accès consultation + édition profil personnel uniquement**

| Zone | Visible | Éditable | Actions possibles |
|------|---------|----------|-------------------|
| **Header** | ✅ | - | Badge role uniquement |
| **Zone Team Information** | ✅ | ❌ | Formulaire visible mais disabled |
| **Zone Invitations** | ❌ | ❌ | Section complètement cachée |
| **Zone Members** | ✅ | ❌ | Liste visible, aucune action sauf soi |

**Actions membres disponibles :**
- ✅ Voir liste membres (lecture seule)
- ❌ Éditer profil autres membres
- ❌ Changer role
- ❌ Transférer propriété
- ❌ Exclure membre
- ✅ Éditer SON propre profil uniquement
- ✅ Quitter équipe

**Clarification importante :**
- Player/Coach/Analyst voient la **même interface** que Owner/Manager
- Mais les inputs sont **disabled** (grisés, non cliquables)
- Message explicite : **"🔒 Read-only access (role = PLAYER/COACH/ANALYST)"**

---

## 4. MATRICE PERMISSIONS PAR RÔLE

### 🆕 **TABLEAU COMPLET v1.1** (avec isOwner)

| Action | isOwner=true<br/>any role | isOwner=false<br/>role=MANAGER | isOwner=false<br/>role≠MANAGER |
|--------|---------------------------|-------------------------------|-------------------------------|
| **ÉQUIPE** | | | |
| Voir infos équipe | ✅ | ✅ | ✅ |
| Éditer nom équipe | ✅ | ✅ | ❌ |
| Éditer tag équipe | ✅ | ✅ | ❌ |
| Uploader logo | ✅ | ✅ | ❌ |
| Modifier liens (HLTV, Faceit, Twitter) | ✅ | ✅ | ❌ |
| **INVITATIONS** | | | |
| Voir zone invitations | ✅ | ❌ | ❌ |
| Générer lien invitation | ✅ | ❌ | ❌ |
| Copier lien invitation | ✅ | ❌ | ❌ |
| Régénérer lien invitation | ✅ | ❌ | ❌ |
| **MEMBRES - CONSULTATION** | | | |
| Voir liste membres | ✅ | ✅ | ✅ |
| Voir profil complet membre | ✅ | ✅ | ✅ (lecture) |
| **MEMBRES - ÉDITION PROFIL** | | | |
| Éditer son propre profil | ✅ | ✅ | ✅ |
| Éditer profil autre membre (isOwner=false) | ✅ | ✅ | ❌ |
| Éditer profil Owner (isOwner=true) | ✅ | ✅ | ❌ |
| **MEMBRES - GESTION RÔLES** | | | |
| Changer role autre membre (isOwner=false) | ✅ | ✅ | ❌ |
| Changer role Owner (isOwner=true) | ✅ | ✅ | ❌ |
| Changer son propre role | ✅ | ❌ | ❌ |
| **MEMBRES - GESTION PROPRIÉTÉ** | | | |
| Transférer propriété (isOwner → autre) | ✅ | ❌ | ❌ |
| Recevoir propriété (autre → soi) | ✅ (action owner) | - | - |
| **MEMBRES - EXCLUSION** | | | |
| Exclure membre (isOwner=false) | ✅ | ✅ | ❌ |
| Exclure Owner (isOwner=true) | ❌ | ❌ | ❌ |
| Quitter équipe (soi-même) | ❌* | ✅ | ✅ |

**\* Owner ne peut pas quitter équipe** : Doit d'abord transférer isOwner à un autre membre.

---

### 🆕 **CAS D'USAGE EXPLICITES** (v1.1)

#### **Cas 1 : Manager change role d'un Owner**

**Situation :**
```
John:  isOwner = true,  role = PLAYER
Sarah: isOwner = false, role = MANAGER
```

**Action :** Sarah ouvre ChangeRoleModal sur John

**Interface :**
```
┌────────────────────────────────────────┐
│ Change Role for John                   │
│                                        │
│ Current: PLAYER                        │
│ Owner status: YES (cannot be changed) │
│                                        │
│ ⚪ PLAYER (current)                    │
│ ⚪ COACH                                │
│ ⚪ ANALYST                              │
│ ⚪ MANAGER                              │
│                                        │
│ Note: Changing role does not affect   │
│ ownership. John will remain Owner.    │
│                                        │
│ [Cancel] [Save changes]                │
└────────────────────────────────────────┘
```

**Résultat après changement vers COACH :**
```
John:  isOwner = true,  role = COACH
```

✅ John garde sa propriété (isOwner = true)  
✅ John a maintenant le role COACH  
✅ John garde toutes les permissions Owner  

---

#### **Cas 2 : Owner Player a tous les accès**

**Situation :**
```
John: isOwner = true, role = PLAYER
```

**Accès de John dans ManagementPage :**

```
Zone Team Information:
✅ Inputs actifs (peut éditer nom, logo, liens)
✅ Bouton [Save changes] visible

Zone Invitations:
✅ Section visible
✅ Peut générer liens d'invitation

Zone Members:
✅ Peut éditer tous les profils
✅ Peut changer tous les roles
✅ Peut transférer sa propriété
✅ Peut exclure tous (sauf lui-même)
❌ Ne peut pas quitter l'équipe
```

**Badges affichés :**
```
[OWNER] [PLAYER]
  ↑       ↑
  Jaune   Gris
```

---

#### **Cas 3 : Manager ne peut pas transférer propriété**

**Situation :**
```
Sarah: isOwner = false, role = MANAGER
John:  isOwner = true,  role = PLAYER
```

**Sarah sélectionne John dans Members Management :**

**Panel édition :**
```
┌─────────────────────────────────────────────┐
│ EDIT MEMBER: John                           │
│ [OWNER] [PLAYER]                            │
│                                              │
│ ─── Personal Info ───                       │
│ First name: [John____]                      │
│ Last name:  [Doe_____]                      │
│                                              │
│ ─── Role ───                                │
│ [PLAYER ▼] [Change role]                    │
│                                              │
│ ─── Ownership ───                           │
│ Status: Owner                               │
│ ⚠️ Only John can transfer ownership         │
│                                              │
│ ─── Actions ───                             │
│ [Kick member] ← DISABLED (cannot kick owner)│
│                                              │
│ [Save changes] [Cancel]                     │
└─────────────────────────────────────────────┘
```

✅ Sarah peut changer le role de John  
❌ Sarah ne voit pas le bouton "Transfer ownership"  
❌ Sarah ne peut pas exclure John  

---

#### **Cas 4 : Player peut quitter, Owner ne peut pas**

**Situation 1 : Player non-Owner**
```
Mike: isOwner = false, role = PLAYER
```

**Mike sélectionne son propre profil :**
```
┌─────────────────────────────────────────────┐
│ EDIT YOUR PROFILE                           │
│ [PLAYER]                                    │
│                                              │
│ [Formulaire édition profil]                 │
│                                              │
│ ─── Actions ───                             │
│ [Leave team] ← VISIBLE                      │
│                                              │
│ [Save changes] [Cancel]                     │
└─────────────────────────────────────────────┘
```

✅ Mike peut quitter l'équipe

---

**Situation 2 : Player Owner**
```
John: isOwner = true, role = PLAYER
```

**John sélectionne son propre profil :**
```
┌─────────────────────────────────────────────┐
│ EDIT YOUR PROFILE                           │
│ [OWNER] [PLAYER]                            │
│                                              │
│ [Formulaire édition profil]                 │
│                                              │
│ ─── Ownership ───                           │
│ You are the owner of this team             │
│ [Transfer ownership to...]                  │
│                                              │
│ ─── Actions ───                             │
│ [Leave team] ← DISABLED                     │
│ ⚠️ Transfer ownership before leaving        │
│                                              │
│ [Save changes] [Cancel]                     │
└─────────────────────────────────────────────┘
```

❌ John ne peut pas quitter sans transférer isOwner

---

### 🆕 **CHANGEROLEMODAL v1.1**

#### **Structure modal**

```
┌────────────────────────────────────────┐
│ Change Role for [Nickname]             │
│                                        │
│ Current role: [CURRENT_ROLE]          │
│ Owner status: [YES/NO]                 │
│                                        │
│ ⚪ PLAYER                               │
│ Basic team member                      │
│ • View team                            │
│ • Edit own profile                     │
│                                        │
│ ⚪ COACH                                │
│ Team coach                             │
│ • View team                            │
│ • Edit own profile                     │
│ • Access strategies                    │
│                                        │
│ ⚪ ANALYST                              │
│ Team analyst                           │
│ • View team                            │
│ • View stats                           │
│                                        │
│ 🔵 MANAGER (selected)                  │
│ Team manager                           │
│ • Edit team info                       │
│ • Edit member profiles                 │
│ • Kick members (except owner)          │
│                                        │
│ ℹ️ Note: Changing role does not       │
│ affect ownership status.               │
│                                        │
│ [Cancel] [Save changes]                │
└────────────────────────────────────────┘
```

#### **Règles modal**

1. **La modal change UNIQUEMENT role**
   - Pas de sélection "OWNER" dans la liste
   - isOwner ne peut pas être modifié ici

2. **Affichage statut Owner**
   - Ligne "Owner status: YES/NO" en haut (lecture seule)
   - Si isOwner = true : Message "This member is the owner"

3. **Message explicatif**
   - Note en bas : "Changing role does not affect ownership status"
   - Clarté : le changement de role ne change pas isOwner

4. **Action séparée pour transfert propriété**
   - Bouton "Transfer ownership" dans le panel membre (pas dans modal)
   - Action distincte, confirmation lourde requise

---

### 🆕 **BADGES VISUELS v1.1**

#### **Affichage badges**

**Règle d'affichage :**
```
SI isOwner = true ET role défini :
  Afficher [OWNER] [ROLE]

SI isOwner = false ET role défini :
  Afficher [ROLE] uniquement
```

#### **Ordre et styles**

| Contexte | Badge 1 (gauche) | Badge 2 (droite) |
|----------|------------------|------------------|
| **Owner + Role** | `[OWNER]` jaune | `[ROLE]` couleur role |
| **Non-Owner + Role** | - | `[ROLE]` couleur role |

**Exemples :**

```
John (isOwner=true, role=PLAYER):
[OWNER] [PLAYER]
 ↑       ↑
 Jaune   Gris

Sarah (isOwner=false, role=MANAGER):
[MANAGER]
 ↑
 Violet

Mike (isOwner=true, role=MANAGER):
[OWNER] [MANAGER]
 ↑       ↑
 Jaune   Violet
```

#### **Codes couleurs badges**

| Badge | Background | Text |
|-------|------------|------|
| **OWNER** | `bg-yellow-600/20` | `text-yellow-400` |
| **MANAGER** | `bg-purple-600/20` | `text-purple-400` |
| **COACH** | `bg-blue-600/20` | `text-blue-400` |
| **ANALYST** | `bg-green-600/20` | `text-green-400` |
| **PLAYER** | `bg-gray-600/20` | `text-gray-400` |

#### **Placements badges**

| Contexte | Position | Format |
|----------|----------|--------|
| **Sidebar** | Haut sidebar | Badge Owner (si isOwner) + Badge Role |
| **ManagementPage header** | À droite du titre | Badge Owner (si isOwner) + Badge Role |
| **MemberCard** | Sous le pseudo | Badge Owner (si isOwner) + Texte role |
| **MemberEditPanel** | Header panel | Badge Owner (si isOwner) + Badge Role |

---

## 5. STRUCTURE MANAGEMENTPAGE FINALE

### 📐 Layout (scroll continu, SANS TABS)

```
┌────────────────────────────────────────────────────────┐
│ MANAGEMENTPAGE                                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ HEADER                                        │    │
│  │ Team Management                               │    │
│  │ Your role: [OWNER] [MANAGER] ← si isOwner     │    │
│  │            [MANAGER] ← si role=MANAGER        │    │
│  │            [PLAYER] ← si role=PLAYER          │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  ════════════════════════════════════════════════      │
│  TEAM INFORMATION                                       │
│  ════════════════════════════════════════════════      │
│                                                         │
│  [Logo upload] ← disabled si !isOwner AND role≠MANAGER │
│  Team name: [____________] ← idem                      │
│  Team tag:  [____]         ← idem                      │
│  Game:      [CS2]          ← idem                      │
│                                                         │
│  Links:                                                 │
│  HLTV:   [________________] ← idem                     │
│  Faceit: [________________] ← idem                     │
│  Twitter:[________________] ← idem                     │
│                                                         │
│  [Save changes] ← hidden si !canEditTeam               │
│                                                         │
│  🔒 Read-only access ← si !canEditTeam                 │
│                                                         │
│  ════════════════════════════════════════════════      │
│  INVITATIONS                                            │
│  ════════════════════════════════════════════════      │
│                                                         │
│  ← Section VISIBLE uniquement si isOwner=true          │
│  ← Section CACHÉE si isOwner=false                     │
│                                                         │
│  [Generate invite link]                                │
│  https://teamwise.app/join?token=... [Copy]            │
│                                                         │
│  ════════════════════════════════════════════════      │
│  MEMBERS MANAGEMENT                                     │
│  ════════════════════════════════════════════════      │
│                                                         │
│  ┌────────────────────────────────────────────┐       │
│  │ Search: [________]  Filter: [All ▼]       │       │
│  └────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│  │ Card    │  │ Card    │  │ Card    │                │
│  │ [OWNER] │  │[MANAGER]│  │ [COACH] │                │
│  │ [PLAYER]│  │         │  │         │                │
│  │         │  │         │  │         │                │
│  │ [Hover: │  │         │  │         │                │
│  │ actions]│  │         │  │         │                │
│  └─────────┘  └─────────┘  └─────────┘                │
│                                                         │
│  [Clic sur card → Panel édition expanded inline]      │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │ MEMBER EDIT PANEL (si card sélectionnée)   │      │
│  │                                              │      │
│  │ [Avatar] Nickname                           │      │
│  │ [OWNER] [ROLE] ← Badges                     │      │
│  │                                              │      │
│  │ ─── Personal Info ───                       │      │
│  │ [Formulaire édition]                        │      │
│  │                                              │      │
│  │ ─── Role ───                                │      │
│  │ [Dropdown rôle] ← disabled si !canEditRole │      │
│  │ [Change role] ← hidden si !canEditRole      │      │
│  │                                              │      │
│  │ ─── Ownership ─── (si target.isOwner)      │      │
│  │ Status: Owner                               │      │
│  │ [Transfer ownership] ← isOwner=true only    │      │
│  │                                              │      │
│  │ ─── Actions ───                             │      │
│  │ [Kick member] ← hidden si !canKick          │      │
│  │ [Leave team] ← si c'est soi-même            │      │
│  │                                              │      │
│  │ [Save changes] [Cancel]                     │      │
│  └─────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────┘
```

### 🔄 Comportement scroll

- **Pas de tabs** : Toutes les zones visibles en scroll continu
- **Zone Invitations** : `if (isOwner) { visible } else { hidden }`
- **Zone Members** : Toujours visible, actions conditionnelles selon permissions

---

## 6. ÉTATS VISUELS PAR RÔLE

### 🎨 Zone Team Information

#### **isOwner=true OU role=MANAGER (édition autorisée)**

```css
Inputs:
  bg-neutral-800
  border-neutral-700
  text-white
  cursor-text
  placeholder-neutral-400

Button [Save changes]:
  visible: true
  bg-indigo-600
  hover:bg-indigo-500

Message:
  hidden
```

**Rendu visuel :**
```
┌──────────────────────────────────────┐
│ Team name: [Awesome Team______]     │ ← Input actif, bordure normale
│            ↑ curseur visible         │
│                                      │
│ [Save changes] ← Bouton indigo       │
└──────────────────────────────────────┘
```

---

#### **isOwner=false ET role≠MANAGER (édition interdite)**

```css
Inputs:
  bg-neutral-900 (plus foncé)
  border-neutral-800 (moins contrasté)
  text-gray-500 (texte grisé)
  cursor-not-allowed
  disabled: true

Button [Save changes]:
  visible: false (hidden)

Message:
  visible: true
  text: "🔒 Read-only access (role = [PLAYER/COACH/ANALYST])"
  className: "text-sm text-amber-400 bg-amber-600/10 p-3 rounded-lg"
```

**Rendu visuel :**
```
┌──────────────────────────────────────┐
│ Team name: [Awesome Team______]     │ ← Input grisé, curseur interdit
│            ↑ gris, non cliquable     │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ 🔒 Read-only access            │  │ ← Message ambre
│ │    (role = PLAYER)             │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

### 🎨 Zone Invitations

#### **isOwner=true (visible)**

```typescript
if (membership.isOwner === true) {
  // Section visible
}
```

**Rendu visuel :**
```
════════════════════════════════════════
INVITATIONS
════════════════════════════════════════

[Generate invite link]

https://teamwise.app/join?token=abc123 [Copy]
```

---

#### **isOwner=false (cachée)**

```typescript
if (membership.isOwner === false) {
  // Section complètement cachée (pas de placeholder)
  // Pas de message "Accès refusé"
  // La section n'existe tout simplement pas
}
```

**Rendu visuel :**
```
════════════════════════════════════════
TEAM INFORMATION
════════════════════════════════════════
[Formulaire équipe]

════════════════════════════════════════
MEMBERS MANAGEMENT
════════════════════════════════════════
[Liste membres]

← Pas de section Invitations
```

**Raison :**
- Membres non-Owner n'ont **pas besoin de savoir** que cette section existe
- Pas de frustration "Accès refusé"
- Interface épurée

---

### 🎨 Zone Members Management

#### **isOwner=true (toutes actions visibles)**

```
MemberCard (au hover) :
  ┌─────────────────────────────────────┐
  │ [Avatar] Nickname                   │
  │ [MANAGER]                           │
  │                                      │
  │ [Actions au hover:]                 │
  │ [Edit] [Change role] [Kick]         │
  └─────────────────────────────────────┘

Panel édition (si sélectionné) :
  [Save] [Change role] [Kick member]
  
  Si target.isOwner = true :
  [Save] [Change role] [Transfer ownership] (pas de Kick)
```

---

#### **role=MANAGER, isOwner=false (actions partielles)**

```
MemberCard non-Owner (au hover) :
  ┌─────────────────────────────────────┐
  │ [Avatar] Nickname                   │
  │ [PLAYER]                            │
  │                                      │
  │ [Actions au hover:]                 │
  │ [Edit] [Change role] [Kick]         │
  └─────────────────────────────────────┘

MemberCard Owner (au hover) :
  ┌─────────────────────────────────────┐
  │ [Avatar] Nickname                   │
  │ [OWNER] [PLAYER]                    │
  │                                      │
  │ [Actions au hover:]                 │
  │ [Edit] [Change role]                │
  │ (pas de Kick, pas de Transfer)      │
  └─────────────────────────────────────┘

Panel édition (si sélectionné) :
  - Si membre normal : [Save] [Change role] [Kick]
  - Si Owner : [Save] [Change role] (pas de Kick, pas de Transfer)
```

---

#### **role≠MANAGER, isOwner=false (aucune action sauf soi-même)**

```
MemberCard autres membres (au hover) :
  ┌─────────────────────────────────────┐
  │ [Avatar] Nickname                   │
  │ [MANAGER]                           │
  │                                      │
  │ (Pas d'actions visibles)            │
  └─────────────────────────────────────┘

MemberCard SOI-MÊME (au hover) :
  ┌─────────────────────────────────────┐
  │ [Avatar] Nickname (You)             │
  │ [PLAYER]                            │
  │                                      │
  │ [Actions au hover:]                 │
  │ [Edit my profile] [Leave team]      │
  └─────────────────────────────────────┘

Panel édition (si sélectionné sur soi-même) :
  [Save] [Leave team]
  (pas de Change role, pas de Kick)
```

---

### 📊 Récapitulatif états visuels

| Zone | isOwner=true | role=MANAGER<br/>isOwner=false | role≠MANAGER<br/>isOwner=false |
|------|--------------|-------------------------------|-------------------------------|
| **Team Information** | Inputs actifs | Inputs actifs | Inputs disabled + message |
| **Invitations** | Visible | Cachée | Cachée |
| **Members (autres)** | Toutes actions | Actions partielles | Aucune action |
| **Members (soi)** | Actions + Transfer | Actions + Leave | Edit profil + Leave |

---

## 7. RÈGLES ABSOLUES

### 🚫 Règle 1 : Aucune duplication logique

**❌ INTERDIT :**
```typescript
// TeamPage.tsx
if (canEditTeam) {
  return <button onClick={editTeam}>Edit</button>
}
```

**✅ AUTORISÉ :**
```typescript
// TeamPage.tsx
if (membership.isOwner || membership.role === "MANAGER") {
  return (
    <button onClick={() => navigate('/team/:id/management')}>
      Go to Management
    </button>
  )
}
```

**Principe :**
- TeamPage = **aucune logique d'édition**
- Seulement des **liens de navigation** vers ManagementPage

---

### 🚫 Règle 2 : Aucune action d'édition sur TeamPage

**❌ INTERDIT sur TeamPage :**
- Boutons "Edit"
- Formulaires
- Inputs
- Menus actions (⋮)
- Actions au hover (sauf navigation)
- Modals d'édition
- Panels d'édition

**✅ AUTORISÉ sur TeamPage :**
- Boutons de navigation (vers ManagementPage)
- Affichage lecture seule
- Statistiques calculées

---

### 🆕 **Règle 3 : Distinction stricte role vs isOwner**

**❌ INTERDIT :**
```typescript
// Traiter "OWNER" comme un role
if (member.role === "OWNER") { ... }

// Confondre les deux concepts
const canEdit = member.role === "MANAGER" || member.role === "OWNER"
```

**✅ OBLIGATOIRE :**
```typescript
// Séparer clairement les deux
const canEditTeam = member.isOwner || member.role === "MANAGER"
const canInvite = member.isOwner  // uniquement isOwner
const canKickOwner = false  // personne ne peut kick l'Owner
```

**Principe :**
- `isOwner` = propriété administrative (booléen)
- `role` = fonction dans l'équipe (enum)
- Les deux sont indépendants
- Les permissions sont calculées avec les deux

---

### 🆕 **Règle 4 : ChangeRoleModal ne gère QUE role**

**❌ INTERDIT :**
```typescript
// Permettre de sélectionner "OWNER" dans la modal
<option value="OWNER">Owner</option>
```

**✅ OBLIGATOIRE :**
```typescript
// Roles disponibles uniquement
<option value="PLAYER">Player</option>
<option value="COACH">Coach</option>
<option value="ANALYST">Analyst</option>
<option value="MANAGER">Manager</option>

// Afficher isOwner en lecture seule
{member.isOwner && (
  <div className="text-yellow-400">
    This member is the owner
  </div>
)}
```

**Principe :**
- Modal = changement de `role` uniquement
- Transfert `isOwner` = action séparée (bouton "Transfer ownership")
- Message clair : "Changing role does not affect ownership"

---

### 🚫 Règle 5 : Permissions visuellement compréhensibles

**❌ MAUVAIS :**
```
Input actif + message technique "You don't have permission to edit this field"
```

**✅ BON :**
```
Input visiblement disabled (gris, curseur interdit) + message clair "🔒 Read-only access (role = PLAYER)"
```

**Principe :**
- L'utilisateur doit **comprendre visuellement** sans lire de message
- Input disabled = "Je ne peux pas éditer"
- Section cachée = "Ça ne me concerne pas"

---

### 🚫 Règle 6 : Pas de frustration inutile

**❌ MAUVAIS :**
```
Manager voit zone Invitations avec message "Access denied (Owner only)"
```

**✅ BON :**
```
Manager ne voit pas du tout la zone Invitations
```

**Principe :**
- Si l'utilisateur n'a pas accès, **ne pas afficher**
- Pas de messages "Accès refusé" inutiles
- Interface épurée selon permissions

---

### 🚫 Règle 7 : Cohérence structure par rôle

**Principe :**
- Tous les membres voient **la même structure** dans ManagementPage
- Les différences sont :
  - **États disabled** (inputs grisés)
  - **Actions masquées** (boutons cachés)
  - **Sections cachées** (zone Invitations si !isOwner)

**Raison :**
- Uniformité interface
- Facilité maintenance
- Compréhension intuitive

---

### 🆕 **Règle 8 : Owner ne peut pas quitter sans transférer**

**❌ INTERDIT :**
```typescript
// Permettre à Owner de quitter directement
if (isSelf) {
  return <button onClick={leaveTeam}>Leave</button>
}
```

**✅ OBLIGATOIRE :**
```typescript
// Vérifier isOwner avant de permettre Leave
if (isSelf && !member.isOwner) {
  return <button onClick={leaveTeam}>Leave team</button>
}

if (isSelf && member.isOwner) {
  return (
    <div>
      <button disabled>Leave team</button>
      <p className="text-amber-400">
        ⚠️ Transfer ownership before leaving
      </p>
      <button onClick={showTransferOwnershipModal}>
        Transfer ownership
      </button>
    </div>
  )
}
```

**Principe :**
- Owner doit transférer `isOwner` avant de pouvoir quitter
- Bouton "Leave" désactivé si `isOwner = true`
- Proposer action "Transfer ownership" à la place

---

## 📊 VALIDATION CONTRAT v1.1

### ✅ Checklist validation

- [x] TeamPage = consultation pure (aucune édition)
- [x] ManagementPage = administration (toutes les actions)
- [x] Aucune duplication logique entre les 2 pages
- [x] **Distinction formelle role vs isOwner établie**
- [x] **isOwner défini comme statut administratif unique**
- [x] **role défini comme fonction dans l'équipe**
- [x] **Clarification : Manager peut changer role de Owner**
- [x] **Clarification : Manager ne peut pas transférer propriété**
- [x] **Clarification : Player peut être Owner (isOwner=true, role=PLAYER)**
- [x] Permissions Owner définies (accès complet si isOwner=true)
- [x] Permissions Manager définies (édition équipe + membres, pas invitations)
- [x] Permissions autres roles définies (édition profil personnel uniquement)
- [x] **ChangeRoleModal change uniquement role (pas isOwner)**
- [x] **Transfert propriété = action séparée**
- [x] **Badges affichage : [OWNER] + [ROLE] si les deux**
- [x] États visuels définis par permissions (disabled, hidden, messages)
- [x] Structure ManagementPage scroll continu (3 zones, pas de tabs)
- [x] Zone Invitations cachée si isOwner=false
- [x] Actions membres conditionnelles par permissions
- [x] Messages explicites pour permissions refusées
- [x] Pas de frustration inutile (sections cachées vs "Accès refusé")
- [x] **Owner ne peut pas quitter sans transférer isOwner**

---

## 🆕 **EXEMPLES RÉCAPITULATIFS v1.1**

### Exemple 1 : Owner Player

```
Membre: John
isOwner: true
role: PLAYER

Badges affichés:
[OWNER] [PLAYER]

Permissions:
✅ Éditer équipe (nom, logo, liens)
✅ Générer invitations
✅ Éditer tous les profils
✅ Changer tous les roles (y compris le sien)
✅ Transférer sa propriété à un autre
✅ Exclure tous (sauf lui-même)
❌ Quitter équipe (doit transférer isOwner avant)

Interface ManagementPage:
Zone Team Information: Inputs actifs
Zone Invitations: Visible
Zone Members: Toutes actions disponibles
```

---

### Exemple 2 : Manager non-Owner

```
Membre: Sarah
isOwner: false
role: MANAGER

Badges affichés:
[MANAGER]

Permissions:
✅ Éditer équipe (nom, logo, liens)
❌ Générer invitations (zone cachée)
✅ Éditer tous les profils (y compris Owner)
✅ Changer tous les roles (y compris Owner)
❌ Transférer propriété (réservé isOwner)
✅ Exclure membres (sauf Owner)
✅ Quitter équipe

Interface ManagementPage:
Zone Team Information: Inputs actifs
Zone Invitations: Cachée
Zone Members: Actions partielles (pas de kick Owner, pas de Transfer)
```

---

### Exemple 3 : Player non-Owner

```
Membre: Mike
isOwner: false
role: PLAYER

Badges affichés:
[PLAYER]

Permissions:
❌ Éditer équipe (formulaire disabled)
❌ Générer invitations (zone cachée)
✅ Éditer SON profil uniquement
❌ Changer roles
❌ Exclure membres
✅ Quitter équipe

Interface ManagementPage:
Zone Team Information: Inputs disabled + message "Read-only"
Zone Invitations: Cachée
Zone Members: Aucune action sauf sur soi-même (Edit + Leave)
```

---

### Exemple 4 : Manager change role d'un Owner

```
Acteur: Sarah (isOwner=false, role=MANAGER)
Cible: John (isOwner=true, role=PLAYER)

Action: Sarah ouvre ChangeRoleModal sur John

Modal affiche:
- Current role: PLAYER
- Owner status: YES (cannot be changed here)
- Options: PLAYER, COACH, ANALYST, MANAGER
- Note: "Changing role does not affect ownership"

Sarah sélectionne: COACH
Sarah clique: [Save changes]

Résultat:
John: isOwner=true, role=COACH (Owner garde sa propriété)

Sarah NE PEUT PAS:
❌ Transférer la propriété de John
❌ Exclure John
```

---

## 📜 SIGNATURE CONTRAT v1.1

**Ce contrat UX est définitif et verrouillé.**

### Engagement v1.1

- ✅ Aucune édition sur TeamPage
- ✅ Toutes les actions dans ManagementPage
- ✅ **Distinction stricte role vs isOwner**
- ✅ **isOwner = statut administratif unique**
- ✅ **role = fonction dans l'équipe**
- ✅ **ChangeRoleModal change uniquement role**
- ✅ **Transfert propriété = action séparée**
- ✅ Permissions strictes par isOwner + role
- ✅ États visuels clairs et compréhensibles
- ✅ Pas de duplication logique

### Changelog v1.1 → v1.0

**Ajouts :**
- Section "Distinction role vs isOwner" complète
- Clarification Manager peut changer role de Owner
- Clarification Player peut être Owner
- ChangeRoleModal mise à jour (role uniquement)
- Badges affichage explicités ([OWNER] + [ROLE])
- Règle 8 : Owner ne peut pas quitter sans transférer
- 4 exemples récapitulatifs détaillés

**Modifications :**
- Matrice permissions réécrite avec isOwner + role
- Tableaux comportement par profil mis à jour
- États visuels clarifiés avec conditions isOwner
- Cas d'usage explicites ajoutés

**Non modifié :**
- Structure TeamPage vs ManagementPage
- Zones ManagementPage (scroll continu)
- Suppressions composants
- Règles absolues 1-7

### Prochaine étape

**Implémentation progressive** selon ce contrat v1.1 :
1. Phase 1 : Nettoyer TeamPage (supprimer toute logique édition)
2. Phase 2 : Restructurer ManagementPage (3 zones scroll, pas de tabs)
3. Phase 3 : Implémenter permissions avec isOwner + role
4. Phase 4 : ChangeRoleModal (role uniquement)
5. Phase 5 : Badges affichage ([OWNER] + [ROLE])
6. Phase 6 : Transfer ownership (action séparée)
7. Phase 7 : Tests permissions complète

---

**Date** : 15 février 2026  
**Version** : 1.1 - Séparation role/isOwner  
**Statut** : ✅ Validé pour implémentation  
**Signataires** : Équipe TeamWise
