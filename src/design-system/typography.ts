/**
 * Design System - Typography
 * Échelle typographique cohérente
 */

export const typography = {
  // Page Title (h1)
  pageTitle: 'text-3xl font-semibold text-white',

  // Section Title (h2)
  sectionTitle: 'text-xl font-semibold text-white',

  // Subsection Title (h3)
  subsectionTitle: 'text-sm font-semibold text-white uppercase tracking-wider',

  // Body Large
  bodyLarge: 'text-base text-neutral-300',

  // Body (default)
  body: 'text-sm text-neutral-300',

  // Small
  small: 'text-xs text-neutral-400',

  // Caption
  caption: 'text-xs text-neutral-500 uppercase tracking-wide',

  // Labels
  label: 'text-xs font-medium text-neutral-400',

  // Links
  link: 'text-sm text-indigo-400 hover:text-indigo-300 transition-colors',
} as const;

export type TypographyKey = keyof typeof typography;

