import type { Game } from '@/api/types/team';

/**
 * Retourne les types de liens valides selon le jeu de l'équipe
 * Utilisé dans EditableProfileSection et ProfilViewer
 */
export function getValidLinksForGame(game?: Game): string[] {
  if (!game) {
    return ['discord', 'twitter', 'hltv'];
  }

  const linksByGame: Record<Game, string[]> = {
    CS2: ['discord', 'twitter', 'hltv'],
    VALORANT: ['discord', 'twitter'],
  };

  return linksByGame[game] || [];
}

