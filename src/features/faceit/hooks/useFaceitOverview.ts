import { useState, useCallback } from "react";
import { getTeamFaceitOverview } from "@/api/endpoints/faceit.api";
import type { SyncConfig, TeamFaceitOverviewDto } from "@/api/types/faceit";

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    months: 6,
    corePlayerSteamIds: [],
};

// ── SessionStorage helpers ───────────────────────────────────────────────────

const STORAGE_PREFIX = "tw.faceit";

function storageKey(teamId: string, suffix: string) {
    return `${STORAGE_PREFIX}.${suffix}.${teamId}`;
}

function loadJson<T>(key: string): T | null {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
}

function saveJson<T>(key: string, value: T) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

// ── Hook ─────────────────────────────────────────────────────────────────────

type UseFaceitOverviewResult = {
    overview: TeamFaceitOverviewDto | null;
    isLoading: boolean;
    hasLoaded: boolean;
    error: string | null;
    config: SyncConfig;
    setConfig: (config: SyncConfig) => void;
    /** Timestamp of the last successful sync. */
    lastSyncedAt: Date | null;
    /** Initial sync — uses cache if available, does not evict. */
    sync: () => void;
    /** Force refresh — evicts cache and re-fetches from FACEIT API. */
    reload: () => void;
    /** Patches imported match IDs in local state without any network call. */
    patchImportedIds: (add: string[], remove: string[]) => void;
    /** Clears cached overview — forces a re-sync on next action. */
    invalidate: () => void;
};

export function useFaceitOverview(teamId: string): UseFaceitOverviewResult {
    const [overview, setOverview] = useState<TeamFaceitOverviewDto | null>(
        () => loadJson<TeamFaceitOverviewDto>(storageKey(teamId, "overview"))
    );
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(() => overview !== null);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<SyncConfig>(
        () => loadJson<SyncConfig>(storageKey(teamId, "config")) ?? DEFAULT_SYNC_CONFIG
    );
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
        const stored = sessionStorage.getItem(storageKey(teamId, "lastSync"));
        return stored ? new Date(stored) : null;
    });

    const persistConfig = useCallback((cfg: SyncConfig) => {
        setConfig(cfg);
        saveJson(storageKey(teamId, "config"), cfg);
    }, [teamId]);

    const load = useCallback(async (refresh: boolean, cfg: SyncConfig) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getTeamFaceitOverview(teamId, refresh, cfg);
            setOverview(data);
            setHasLoaded(true);
            saveJson(storageKey(teamId, "overview"), data);
            const now = new Date();
            setLastSyncedAt(now);
            sessionStorage.setItem(storageKey(teamId, "lastSync"), now.toISOString());
        } catch {
            setError("error");
            setHasLoaded(true);
        } finally {
            setIsLoading(false);
        }
    }, [teamId]);

    const patchImportedIds = useCallback((add: string[], remove: string[]) => {
        if (add.length === 0 && remove.length === 0) return;
        setOverview(prev => {
            if (!prev) return prev;
            const removeSet = new Set(remove);
            const existing = prev.importedFaceitMatchIds.filter(id => !removeSet.has(id));
            const merged = [...new Set([...existing, ...add])];
            const updated = { ...prev, importedFaceitMatchIds: merged };
            saveJson(storageKey(teamId, "overview"), updated);
            return updated;
        });
    }, [teamId]);

    const invalidate = useCallback(() => {
        setOverview(null);
        setHasLoaded(false);
        setLastSyncedAt(null);
        sessionStorage.removeItem(storageKey(teamId, "overview"));
        sessionStorage.removeItem(storageKey(teamId, "lastSync"));
    }, [teamId]);

    return {
        overview,
        isLoading,
        hasLoaded,
        error,
        config,
        setConfig: persistConfig,
        lastSyncedAt,
        sync: () => load(false, config),
        reload: () => load(true, config),
        patchImportedIds,
        invalidate,
    };
}
