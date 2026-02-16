/**
 * Design System - Main Export
 * Point d'entrée unique pour tout le design system
 */

export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { animations } from './animations';

// Helper function pour combiner des classes
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

