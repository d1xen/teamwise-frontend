import type { TeamRole } from "@/contexts/team/team.types";

/**
 * Role Badge Styles - Centralisé pour éviter les doublons
 * Utilisé dans CardMember, MemberDetailPanel, etc.
 */
export const ROLE_BADGE_STYLES: Record<TeamRole, string> = {
  PLAYER: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  COACH: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  ANALYST: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  MANAGER: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
};

/**
 * Role Colors - Pour l'affichage des rôles
 */
export const ROLE_COLORS: Record<TeamRole, string> = {
  PLAYER: "bg-emerald-500/10 text-emerald-300",
  COACH: "bg-blue-500/10 text-blue-300",
  ANALYST: "bg-purple-500/10 text-purple-300",
  MANAGER: "bg-indigo-500/10 text-indigo-300",
};

