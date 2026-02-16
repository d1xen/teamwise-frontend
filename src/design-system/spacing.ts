/**
 * Design System - Spacing
 * Système d'espacement 8pt grid
 */

export const spacing = {
  // Gap (flex/grid spacing)
  gap: {
    tight: 'gap-2',       // 8px
    compact: 'gap-3',     // 12px
    normal: 'gap-4',      // 16px
    comfortable: 'gap-6', // 24px
    spacious: 'gap-8',    // 32px
    extraSpacious: 'gap-12', // 48px
  },

  // Padding
  padding: {
    tight: 'p-4',         // 16px
    normal: 'p-6',        // 24px
    comfortable: 'p-8',   // 32px
  },

  // Max widths
  maxWidth: {
    form: 'max-w-3xl',    // Forms, settings
    content: 'max-w-5xl', // Main content
    wide: 'max-w-7xl',    // Wide content
  },
} as const;

export type SpacingKey = keyof typeof spacing;

