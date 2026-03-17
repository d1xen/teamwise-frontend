import type { Game, InGameRole } from "@/api/types/team";

/**
 * Rôles in-game disponibles selon le jeu
 * CS2 : RIFLER, SNIPER, IGL
 * VALORANT : À ajouter selon le backend (AWPer, Controller, etc.)
 */
export const IN_GAME_ROLES: Record<Game, InGameRole[]> = {
  CS2: ["RIFLER", "SNIPER", "IGL"],
  VALORANT: ["RIFLER", "SNIPER", "IGL"], // À adapter selon les rôles VALORANT
};

/**
 * Obtenir les rôles in-game disponibles pour un jeu donné
 */
export function getAvailableInGameRoles(game?: Game): InGameRole[] {
  if (!game || !IN_GAME_ROLES[game]) {
    return ["RIFLER", "SNIPER", "IGL"];
  }
  return IN_GAME_ROLES[game];
}

/**
 * Traduction des rôles in-game
 */
export const IN_GAME_ROLE_LABELS: Record<InGameRole, string> = {
  RIFLER: "Rifler",
  SNIPER: "Sniper",
  IGL: "Leader",
};



