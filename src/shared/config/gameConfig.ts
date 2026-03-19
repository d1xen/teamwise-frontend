import type { Game, InGameRole } from "@/api/types/team";

// ─── In-game roles by game ────────────────────────────────────────────────────

export const GAME_IN_GAME_ROLES: Record<Game, InGameRole[]> = {
    CS2: ["RIFLER", "SNIPER", "IGL"],
    VALORANT: ["DUELIST", "CONTROLLER", "INITIATOR", "SENTINEL", "FLEX"],
};

export const IN_GAME_ROLE_LABELS: Record<InGameRole, string> = {
    // CS2
    RIFLER: "Rifler",
    SNIPER: "Sniper",
    IGL: "Leader",
    // VALORANT
    DUELIST: "Duelist",
    CONTROLLER: "Controller",
    INITIATOR: "Initiator",
    SENTINEL: "Sentinel",
    FLEX: "Flex",
};

export function getAvailableInGameRoles(game?: Game): InGameRole[] {
    if (!game) return GAME_IN_GAME_ROLES.CS2;
    return GAME_IN_GAME_ROLES[game] ?? GAME_IN_GAME_ROLES.CS2;
}

// ─── Profile links by game ────────────────────────────────────────────────────

export const GAME_VALID_PROFILE_LINKS: Record<Game, string[]> = {
    CS2: ["discord", "twitter", "hltv"],
    VALORANT: ["discord", "twitter"],
};

export function getValidLinksForGame(game?: Game): string[] {
    if (!game) return GAME_VALID_PROFILE_LINKS.CS2;
    return GAME_VALID_PROFILE_LINKS[game] ?? GAME_VALID_PROFILE_LINKS.CS2;
}

// ─── Roster limits ────────────────────────────────────────────────────────────

export const MAX_ACTIVE_PLAYERS_BY_GAME: Record<Game, number> = {
    CS2: 5,
    VALORANT: 5,
};

export function getMaxActivePlayers(game?: Game): number {
    if (!game) return 5;
    return MAX_ACTIVE_PLAYERS_BY_GAME[game] ?? 5;
}
