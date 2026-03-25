import type { Game, InGameRole } from "@/api/types/team";

// ─── Maps by game ─────────────────────────────────────────────────────────────

export const GAME_MAPS: Record<Game, { value: string; label: string }[]> = {
    CS2: [
        { value: "de_ancient",  label: "Ancient"  },
        { value: "de_anubis",   label: "Anubis"   },
        { value: "de_cache",    label: "Cache"     },
        { value: "de_dust2",    label: "Dust II"   },
        { value: "de_inferno",  label: "Inferno"   },
        { value: "de_mirage",   label: "Mirage"    },
        { value: "de_nuke",     label: "Nuke"      },
        { value: "de_overpass", label: "Overpass"  },
        { value: "de_train",    label: "Train"     },
        { value: "de_vertigo",  label: "Vertigo"   },
    ],
    VALORANT: [
        { value: "Abyss",   label: "Abyss"   },
        { value: "Ascent",  label: "Ascent"  },
        { value: "Bind",    label: "Bind"    },
        { value: "Breeze",  label: "Breeze"  },
        { value: "Haven",   label: "Haven"   },
        { value: "Icebox",  label: "Icebox"  },
        { value: "Lotus",   label: "Lotus"   },
        { value: "Pearl",   label: "Pearl"   },
        { value: "Split",   label: "Split"   },
        { value: "Sunset",  label: "Sunset"  },
    ],
};

export function getMapsForGame(game?: Game): { value: string; label: string }[] {
    if (!game) return GAME_MAPS.CS2;
    return GAME_MAPS[game] ?? GAME_MAPS.CS2;
}

/**
 * Get the display label for a map value (e.g. "de_mirage" → "Mirage").
 * Falls back to capitalised name without prefix.
 */
export function getMapLabel(mapValue: string, game?: Game): string {
    const maps = getMapsForGame(game);
    const found = maps.find(m => m.value === mapValue);
    if (found) return found.label;
    const raw = mapValue.replace(/^de_/, "");
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Convention-based map image URL.
 * Images stored in public/maps/{game}/{mapValue}.jpg
 */
export function getMapImageUrl(mapValue: string, game: Game = "CS2"): string {
    return `/maps/${game.toLowerCase()}/${mapValue}.jpg`;
}

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
