import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
    getMatchesPaginated,
    createMatch as createMatchApi,
    deleteMatch as deleteMatchApi,
    updateMatch as updateMatchApi,
    updateMapScore as updateMapScoreApi,
} from "@/api/endpoints/match.api";
import type {
    CreateMatchRequest,
    MatchDto,
    MatchFilters,
    UpdateMapScoreRequest,
    UpdateMatchRequest,
} from "@/api/types/match";
import { appStorage } from "@/shared/utils/storage/appStorage";

const DEFAULT_FILTERS: MatchFilters = {
    tab: "upcoming",
    type: "",
    context: "",
    format: "",
    opponent: "",
    dateRange: "all",
};

const PAGE_SIZE = 10;

function loadStoredFilters(teamId: string): MatchFilters {
    try {
        const raw = appStorage.getMatchFilters(teamId);
        if (!raw) return DEFAULT_FILTERS;
        return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_FILTERS;
    }
}

export function useMatches(teamId: string) {
    const { t } = useTranslation();

    const initialFilters = teamId ? loadStoredFilters(teamId) : DEFAULT_FILTERS;
    const [filters, setFilters] = useState<MatchFilters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<MatchFilters>(initialFilters);

    // Accumulated content for infinite scroll
    const [content, setContent] = useState<MatchDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    // Incremented each time a loadFirst resolves — used as React key for fade-in
    const [contentRevision, setContentRevision] = useState(0);

    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
    // Incremented on each loadFirst call — stale responses are discarded
    const fetchIdRef = useRef(0);

    // Persist filters to localStorage whenever they change
    useEffect(() => {
        if (!teamId) return;
        appStorage.setMatchFilters(teamId, JSON.stringify(filters));
    }, [teamId, filters]);

    // Only debounce opponent text input
    useEffect(() => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setAppliedFilters(prev => ({ ...prev, opponent: filters.opponent }));
        }, 350);
        return () => clearTimeout(debounceTimer.current);
    }, [filters.opponent]);

    // Load page 0 — replaces content. Old content stays visible until this resolves.
    const loadFirst = useCallback(async (f: MatchFilters) => {
        if (!teamId) return;
        const id = ++fetchIdRef.current;
        setIsLoading(true);
        setIsLoadingMore(false);
        try {
            const result = await getMatchesPaginated(teamId, f, 0, PAGE_SIZE);
            if (id !== fetchIdRef.current) return;
            setContent(result.content);
            setTotalElements(result.totalElements);
            setHasMore(result.hasNext);
            setCurrentPage(0);
            setContentRevision(r => r + 1);
        } catch {
            if (id === fetchIdRef.current) toast.error(t("matches.load_error"));
        } finally {
            if (id === fetchIdRef.current) setIsLoading(false);
        }
    }, [teamId, t]);

    useEffect(() => {
        loadFirst(appliedFilters);
    }, [loadFirst, appliedFilters]);

    // Load next page — appends content.
    const loadMore = useCallback(async () => {
        if (!hasMore || isLoadingMore || isLoading || !teamId) return;
        const nextPage = currentPage + 1;
        setIsLoadingMore(true);
        try {
            const result = await getMatchesPaginated(teamId, appliedFilters, nextPage, PAGE_SIZE);
            setContent(prev => [...prev, ...result.content]);
            setHasMore(result.hasNext);
            setCurrentPage(nextPage);
        } catch {
            // silent — user can scroll again to retry
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, isLoading, teamId, appliedFilters, currentPage]);

    const reload = useCallback(() => loadFirst(appliedFilters), [loadFirst, appliedFilters]);

    // Non-text filter changes bypass debounce
    const updateFilters = useCallback((patch: Partial<MatchFilters>) => {
        setFilters(prev => ({ ...prev, ...patch }));
        const { opponent, ...rest } = patch;
        if (Object.keys(rest).length > 0) {
            clearTimeout(debounceTimer.current);
            setAppliedFilters(prev => ({ ...prev, ...rest }));
        }
        void opponent; // opponent handled by debounce effect
    }, []);

    // Tab change: preserve active filters, only update tab
    const changeTab = useCallback((tab: MatchFilters["tab"]) => {
        clearTimeout(debounceTimer.current);
        setFilters(prev => {
            const next = { ...prev, tab };
            setAppliedFilters(next);
            return next;
        });
    }, []);

    // ── Mutations ────────────────────────────────────────────────────────────

    const createMatch = async (payload: CreateMatchRequest): Promise<boolean> => {
        try {
            await createMatchApi(teamId, payload);
            toast.success(t("matches.create_success"));
            await reload();
            return true;
        } catch {
            toast.error(t("matches.create_error"));
            return false;
        }
    };

    const deleteMatch = async (matchId: number): Promise<void> => {
        try {
            await deleteMatchApi(matchId);
            toast.success(t("matches.delete_success"));
            await reload();
        } catch {
            toast.error(t("matches.delete_error"));
        }
    };

    const bulkDeleteMatches = async (matchIds: number[]): Promise<void> => {
        try {
            await Promise.all(matchIds.map(id => deleteMatchApi(id)));
            toast.success(t("matches.bulk_delete_success", { count: matchIds.length }));
            await reload();
        } catch {
            toast.error(t("matches.bulk_delete_error"));
        }
    };

    const updateMatch = async (matchId: number, payload: UpdateMatchRequest): Promise<MatchDto | null> => {
        try {
            const updated = await updateMatchApi(matchId, payload);
            await reload();
            return updated;
        } catch {
            toast.error(t("matches.update_error"));
            return null;
        }
    };

    const updateMapScore = async (
        matchId: number,
        mapId: number,
        payload: UpdateMapScoreRequest,
        silent?: boolean
    ): Promise<boolean> => {
        try {
            await updateMapScoreApi(matchId, mapId, payload);
            if (!silent) toast.success(t("matches.score_saved"));
            await reload();
            return true;
        } catch {
            toast.error(t("matches.score_error"));
            return false;
        }
    };

    return {
        content,
        contentRevision,
        totalElements,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMore,
        filters,
        updateFilters,
        changeTab,
        reload,
        createMatch,
        deleteMatch,
        bulkDeleteMatches,
        updateMatch,
        updateMapScore,
    };
}
