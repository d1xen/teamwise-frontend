/**
 * Design System - Colors
 * Palette de couleurs cohérente pour toute l'application
 */

export const colors = {
  // Backgrounds
  background: {
    page: 'bg-neutral-950',
    card: 'bg-neutral-900',
    cardHover: 'bg-neutral-900/80',
    input: 'bg-neutral-800',
    secondary: 'bg-neutral-800/50',
  },

  // Borders
  border: {
    default: 'border-neutral-800',
    hover: 'border-neutral-700',
    focus: 'border-indigo-500/50',
  },

  // Text
  text: {
    primary: 'text-white',
    secondary: 'text-neutral-300',
    tertiary: 'text-neutral-400',
    muted: 'text-neutral-500',
    disabled: 'text-neutral-600',
  },

  // Semantic - Success
  success: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    solid: 'bg-green-600',
    solidHover: 'bg-green-500',
  },

  // Semantic - Warning
  warning: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    solid: 'bg-amber-600',
    solidHover: 'bg-amber-500',
  },

  // Semantic - Danger
  danger: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    solid: 'bg-red-600',
    solidHover: 'bg-red-500',
  },

  // Semantic - Info
  info: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    solid: 'bg-blue-600',
    solidHover: 'bg-blue-500',
  },

  // Primary (brand)
  primary: {
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    solid: 'bg-indigo-600',
    solidHover: 'bg-indigo-500',
  },

  // Roles specifics
  roles: {
    player: {
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    coach: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    analyst: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    manager: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    owner: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  },
} as const;

export type ColorKey = keyof typeof colors;

