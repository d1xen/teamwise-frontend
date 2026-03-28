const ERROR_MAP: [RegExp, string][] = [
    [/URL or ID is required/i, "faceit.error_url_required"],
    [/Invalid FACEIT URL/i, "faceit.error_invalid_url"],
    [/League URLs cannot be imported/i, "faceit.error_league_url"],
    [/not accessible via FACEIT API/i, "faceit.error_competition_not_accessible"],
    [/Competition not found/i, "faceit.error_competition_not_found"],
    [/not part of a competition/i, "faceit.error_matchmaking"],
    [/Matchmaking matches cannot/i, "faceit.error_matchmaking_only"],
    [/Match not found/i, "faceit.error_match_not_found"],
];

export function mapFaceitImportError(message?: string | null): string {
    if (!message) return "faceit.discover_error";
    for (const [pattern, key] of ERROR_MAP) {
        if (pattern.test(message)) return key;
    }
    return "faceit.discover_error";
}
