# 🎨 Design System - TeamWise Frontend

## 📐 Tokens de Design

### Couleurs

#### Background & Surfaces
```css
/* Backgrounds */
bg-neutral-950    # Fond principal le plus sombre
bg-neutral-900    # Fond principal
bg-neutral-800    # Cards, surfaces surélevées
bg-neutral-700    # Hover states

/* Gradients */
bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950
/* Utilisé sur : LoginPage, SelectTeamPage, CreateTeamPage */
```

#### Borders
```css
border-neutral-800  # Border principale
border-neutral-700  # Border hover
border-neutral-600  # Border active
```

#### Text
```css
text-white          # Titres, texte principal
text-neutral-300    # Texte secondaire important
text-neutral-400    # Texte secondaire
text-neutral-500    # Texte tertiaire, disabled
text-neutral-600    # Placeholder, très subtil
```

#### Accent Colors
```css
/* Primary (Indigo) */
bg-indigo-600       # Boutons primaires
bg-indigo-500       # Hover primary
border-indigo-500   # Border accent
text-indigo-400     # Liens, highlights

/* Success (Green) */
bg-green-500/10     # Success background
text-green-400      # Success text
border-green-500/20 # Success border

/* Error (Red) */
bg-red-500/10       # Error background
text-red-400        # Error text
border-red-500/50   # Error border

/* Warning (Amber) */
bg-amber-500/10     # Warning background
text-amber-400      # Owner badge
border-amber-500/20 # Owner border
```

---

## 🎯 Spacing System (8pt grid)

```css
gap-2    # 8px   - Petit espacement interne
gap-3    # 12px  - Espacement standard entre éléments
gap-4    # 16px  - Espacement moyen
gap-6    # 24px  - Espacement large
gap-8    # 32px  - Espacement entre sections
gap-10   # 40px  - Espacement très large
gap-12   # 48px  - Espacement section majeure

p-3      # 12px  - Padding petit
p-4      # 16px  - Padding standard
p-6      # 24px  - Padding confortable
p-8      # 32px  - Padding large (cards)

mb-6     # 24px  - Margin bottom standard
mb-8     # 32px  - Margin bottom entre sections
mb-10    # 40px  - Margin bottom large
mb-12    # 48px  - Margin bottom très large
```

---

## 📏 Typography

### Hiérarchie des Titres
```css
/* Page Title (Hero) */
text-3xl font-bold text-white
/* Exemple: "Créer votre équipe" */

/* Section Title */
text-2xl font-semibold text-white
/* Exemple: "Membres" dans ManagementPage */

/* Subsection Title */
text-xl font-semibold text-white
/* Exemple: "Informations de base" dans formulaire */

/* Card Title */
text-lg font-semibold text-white
/* Exemple: Nom d'équipe dans TeamCard */

/* Label / Small Title */
text-sm font-medium text-white
/* Exemple: Labels de formulaire */

/* Caption / Helper */
text-xs text-neutral-400
/* Exemple: Textes d'aide, sous-titres */
```

### Font Weights
```css
font-bold       # 700 - Titres principaux
font-semibold   # 600 - Titres sections
font-medium     # 500 - Labels, boutons
font-normal     # 400 - Texte standard
```

---

## 🎭 Effets & States

### Rounded Corners
```css
rounded-lg    # 8px  - Inputs, petits boutons
rounded-xl    # 12px - Boutons, cards moyennes
rounded-2xl   # 16px - Cards principales, modals
rounded-full  # 50%  - Avatars, badges circulaires
```

### Shadows
```css
shadow-lg     # Élévation légère
shadow-xl     # Élévation moyenne
shadow-2xl    # Élévation forte (cards principales)

/* Custom glow effect */
box-shadow: 0 0 20px rgba(99, 102, 241, 0.3)
/* Utilisé sur : cercles actifs de progress bar */
```

### Transitions
```css
transition-all duration-200      # Standard
transition-all duration-300      # Moyen
transition-all duration-500      # Lent, smooth
transition-colors duration-200   # Couleurs uniquement

ease-out   # Sortie douce
ease-in    # Entrée douce
```

### Hover States
```css
/* Buttons */
hover:bg-indigo-500       # Primary button
hover:bg-neutral-700      # Secondary surfaces
hover:border-neutral-600  # Borders

/* Scale effects */
hover:scale-[1.02]        # Léger zoom (cards cliquables)
hover:translate-x-1       # Shift horizontal (flèches)

/* Opacity */
hover:opacity-90          # Réduction légère
```

---

## 🧱 Composants du Design System

### Button
```typescript
<Button 
  variant="primary"     // primary | secondary | danger | ghost
  size="md"            // sm | md | lg
  isLoading={false}
>
  Texte
</Button>
```

**Variants** :
- `primary` : bg-indigo-600, texte blanc
- `secondary` : bg-neutral-800, texte blanc
- `danger` : bg-red-600, texte blanc
- `ghost` : transparent, hover bg-neutral-800

### Input
```typescript
<Input
  label="Nom"
  placeholder="Votre nom"
  error="Message d'erreur"
  required
/>
```

**Style** :
- Background: bg-neutral-800
- Border: border-neutral-700
- Focus: ring-2 ring-indigo-500/50
- Height: py-2.5 (40px)

### Badge
```typescript
<Badge variant="owner">OWNER</Badge>
<Badge variant="role">MANAGER</Badge>
```

**Couleurs par rôle** :
- PLAYER : green (text-green-400, bg-green-500/10)
- COACH : blue (text-blue-400, bg-blue-500/10)
- ANALYST : purple (text-purple-400, bg-purple-500/10)
- MANAGER : indigo (text-indigo-400, bg-indigo-500/10)
- OWNER : amber (text-amber-400, bg-amber-500/10)

---

## 🎨 Patterns Visuels

### Glassmorphism
```css
bg-neutral-900/80 backdrop-blur-sm
/* Utilisé sur : Cards principales, modals */
```

### Background Pattern (Grid)
```css
bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),
   linear-gradient(to_bottom,#80808012_1px,transparent_1px)] 
bg-[size:24px_24px]
/* Utilisé sur : Pages de login, création */
```

### Cards Premium
```css
.card-premium {
  @apply bg-neutral-900/80 backdrop-blur-sm 
         border border-neutral-800 rounded-2xl 
         p-8 shadow-2xl;
}
```

### Progress Indicators
```css
/* Circle active */
bg-indigo-500 border-indigo-500 ring-4 ring-indigo-500/20

/* Circle completed */
bg-indigo-600 border-indigo-600

/* Circle pending */
bg-neutral-900 border-neutral-700
```

---

## 🎬 Animations

### Fade In
```css
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.3s ease-out;
}
```

### Spinner
```css
.animate-spin {
  animation: spin 1s linear infinite;
}
/* Utilisé sur : loaders, boutons isLoading */
```

### Pulse (ring)
```css
.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
/* Utilisé sur : LoginSuccessPage (checkmark) */
```

---

## 📱 Responsive

### Breakpoints Tailwind
```css
sm: 640px    # Mobile large
md: 768px    # Tablet
lg: 1024px   # Desktop
xl: 1280px   # Large desktop
2xl: 1536px  # Extra large
```

### Patterns responsifs utilisés
```css
/* Grid responsive */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Spacing responsive */
px-4 md:px-6 lg:px-8

/* Text responsive */
text-2xl md:text-3xl lg:text-4xl
```

---

## 🎯 Guidelines d'utilisation

### ✅ À FAIRE
- Toujours utiliser les couleurs définies (neutral, indigo, etc.)
- Respecter le 8pt grid pour spacing
- Utiliser `rounded-xl` ou `rounded-2xl` pour cards
- Ajouter `transition-all duration-200` sur éléments interactifs
- Utiliser `backdrop-blur-sm` sur overlays/modals
- Grouper les sections avec `space-y-6` ou `space-y-8`

### ❌ À ÉVITER
- Ne pas inventer de nouvelles couleurs
- Ne pas utiliser de spacing arbitraire (p-5, m-7, etc.)
- Ne pas mélanger rounded corners (cohérence)
- Ne pas oublier les transitions sur hover
- Ne pas surcharger visuellement (simplicité)
- Ne pas utiliser de box-shadow natives (utiliser shadow-xl, etc.)

---

## 🎨 Exemples de Compositions

### Page Layout Standard
```tsx
<div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
  {/* Background Pattern */}
  <div className="absolute inset-0 bg-[linear-gradient(...)] bg-[size:24px_24px]" />
  
  {/* Content */}
  <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
    <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-2xl">
      {/* Content here */}
    </div>
  </div>
</div>
```

### Card Interactive
```tsx
<button className="w-full group">
  <div className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl 
                  hover:border-indigo-500/50 hover:bg-neutral-800 
                  transition-all duration-200">
    {/* Card content */}
  </div>
</button>
```

### Section avec Titre
```tsx
<div className="space-y-6">
  <div>
    <h2 className="text-2xl font-semibold text-white mb-2">
      Titre de la section
    </h2>
    <p className="text-sm text-neutral-400">
      Description de la section
    </p>
  </div>
  {/* Contenu */}
</div>
```

---

**Date** : 15 Février 2026  
**Auteur** : Documentation auto-générée  
**Version** : 1.0.0

