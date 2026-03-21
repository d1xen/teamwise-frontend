import { useState, useCallback } from "react";
import { getTeamFaceitOverview } from "@/api/endpoints/faceit.api";
import type { SyncConfig, TeamFaceitOverviewDto } from "@/api/types/faceit";

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    months: 6,
    corePlayerSteamIds: [],
};

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
};

export function useFaceitOverview(teamId: string): UseFaceitOverviewResult {
    const [overview, setOverview] = useState<TeamFaceitOverviewDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<SyncConfig>(DEFAULT_SYNC_CONFIG);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
        const stored = sessionStorage.getItem(`tw.faceit.lastSync.${teamId}`);
        return stored ? new Date(stored) : null;
    });

    const load = useCallback(async (refresh: boolean, cfg: SyncConfig) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getTeamFaceitOverview(teamId, refresh, cfg);
            setOverview(data);
            setHasLoaded(true);
            const now = new Date();
            setLastSyncedAt(now);
            sessionStorage.setItem(`tw.faceit.lastSync.${teamId}`, now.toISOString());
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
            return { ...prev, importedFaceitMatchIds: merged };
        });
    }, []);

    return {
        overview,
        isLoading,
        hasLoaded,
        error,
        config,
        setConfig,
        lastSyncedAt,
        sync: () => load(false, config),
        reload: () => load(true, config),
        patchImportedIds,
    };
}
