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
import { invalidateMatchSummary } from "./useMatchSummary";
import type {
    CreateMatchRequest,
    MatchDto,
    MatchFilters,
    UpdateMapScoreRequest,
    UpdateMatchRequest,
} from "@/api/types/match";
import type { PageSize } from "@/shared/components/Pagination";
import { appStorage } from "@/shared/utils/storage/appStorage";
import { usePolling } from "@/shared/hooks/usePolling";

const DEFAULT_FILTERS: MatchFilters = {
    tab: "upcoming",
    type: "",
    format: "",
    opponent: "",
    competitionId: "",
    dateRange: "all",
};

const DEFAULT_PAGE_SIZE: PageSize = 50;

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

    const [content, setContent] = useState<MatchDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchIdRef = useRef(0);
    const hasContentRef = useRef(false);

    useEffect(() => {
        if (!teamId) return;
        appStorage.setMatchFilters(teamId, JSON.stringify(filters));
    }, [teamId, filters]);

    // Debounce text inputs (opponent)
    useEffect(() => {
        if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setAppliedFilters(prev => ({ ...prev, opponent: filters.opponent }));
        }, 350);
        return () => { if (debounceTimer.current !== null) clearTimeout(debounceTimer.current); };
    }, [filters.opponent]);

    const loadPage = useCallback(async (f: MatchFilters, page: number, size: PageSize) => {
        if (!teamId) return;
        const id = ++fetchIdRef.current;
        if (hasContentRef.current) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        try {
            const result = await getMatchesPaginated(teamId, f, page, size);
            if (id !== fetchIdRef.current) return;
            setContent(result.content);
            setTotalElements(result.totalElements);
            setTotalPages(result.totalPages);
            setCurrentPage(result.page);
            hasContentRef.current = result.content.length > 0;
        } catch {
            if (id === fetchIdRef.current) toast.error(t("matches.load_error"));
        } finally {
            if (id === fetchIdRef.current) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [teamId, t]);

    // Reload when filters change — reset to page 0
    useEffect(() => {
        loadPage(appliedFilters, 0, pageSize);
    }, [loadPage, appliedFilters, pageSize]);

    // Silent poll
    const silentReload = useCallback(async () => {
        if (!teamId) return;
        try {
            const result = await getMatchesPaginated(teamId, appliedFilters, currentPage, pageSize);
            setContent(result.content);
            setTotalElements(result.totalElements);
            setTotalPages(result.totalPages);
        } catch { /* silent */ }
    }, [teamId, appliedFilters, currentPage, pageSize]);

    usePolling(silentReload, 20_000, !isLoading);

    const goToPage = useCallback((page: number) => {
        loadPage(appliedFilters, page, pageSize);
    }, [loadPage, appliedFilters, pageSize]);

    const changePageSize = useCallback((size: PageSize) => {
        setPageSize(size);
        // pageSize change triggers reload via useEffect (resets to page 0)
    }, []);

    const reload = useCallback(() => loadPage(appliedFilters, currentPage, pageSize), [loadPage, appliedFilters, currentPage, pageSize]);

    // Non-text filter changes bypass debounce
    const updateFilters = useCallback((patch: Partial<MatchFilters>) => {
        setFilters(prev => ({ ...prev, ...patch }));
        const { opponent, ...rest } = patch;
        if (Object.keys(rest).length > 0) {
            if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
            setAppliedFilters(prev => ({ ...prev, ...rest }));
        }
        void opponent;
    }, []);

    const changeTab = useCallback((tab: MatchFilters["tab"]) => {
        if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
        setFilters(prev => {
            const next = { ...prev, tab };
            setAppliedFilters(next);
            return next;
        });
    }, []);

    // ── Mutations ──

    const createMatch = async (payload: CreateMatchRequest): Promise<boolean> => {
        try {
            await createMatchApi(teamId, payload);
            toast.success(t("matches.create_success"));
            await reload();
            invalidateMatchSummary();
            return true;
        } catch { toast.error(t("matches.create_error")); return false; }
    };

    const deleteMatch = async (matchId: number): Promise<void> => {
        try {
            await deleteMatchApi(matchId);
            toast.success(t("matches.delete_success"));
            await reload();
            invalidateMatchSummary();
        } catch { toast.error(t("matches.delete_error")); }
    };

    const bulkDeleteMatches = async (matchIds: number[]): Promise<void> => {
        try {
            await Promise.all(matchIds.map(id => deleteMatchApi(id)));
            toast.success(t("matches.bulk_delete_success", { count: matchIds.length }));
            await reload();
            invalidateMatchSummary();
        } catch { toast.error(t("matches.bulk_delete_error")); }
    };

    const updateMatch = async (matchId: number, payload: UpdateMatchRequest): Promise<MatchDto | null> => {
        try {
            const updated = await updateMatchApi(matchId, payload);
            await reload();
            invalidateMatchSummary();
            return updated;
        } catch { toast.error(t("matches.update_error")); return null; }
    };

    const updateMapScore = async (matchId: number, mapId: number, payload: UpdateMapScoreRequest, silent?: boolean): Promise<boolean> => {
        try {
            await updateMapScoreApi(matchId, mapId, payload);
            if (!silent) toast.success(t("matches.score_saved"));
            await reload();
            invalidateMatchSummary();
            return true;
        } catch { toast.error(t("matches.score_error")); return false; }
    };

    return {
        content, totalElements, totalPages, currentPage, pageSize,
        isLoading, isRefreshing,
        filters, updateFilters, changeTab,
        goToPage, changePageSize,
        reload, createMatch, deleteMatch, bulkDeleteMatches, updateMatch, updateMapScore,
    };
}
