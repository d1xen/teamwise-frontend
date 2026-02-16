/**
 * Design System - Animations & Transitions
 * Timing et animations cohérents
 */

export const animations = {
  // Transitions
  transition: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
  },

  // Specific transitions
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',

  // Hover effects
  hover: {
    lift: 'hover:scale-[1.02]',
    liftShadow: 'hover:scale-[1.02] hover:shadow-lg',
  },

  // Focus states
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
    border: 'focus:border-indigo-500/50',
  },
} as const;

export type AnimationKey = keyof typeof animations;

