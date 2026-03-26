import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
    getStrats as getStratsApi,
    createStrat as createStratApi,
    deleteStrat as deleteStratApi,
} from "@/api/endpoints/stratbook.api";
import type {
    CreateStratRequest,
    StratSummaryDto,
    StratFilters,
} from "@/api/types/stratbook";
import type { PageSize } from "@/shared/components/Pagination";

const DEFAULT_FILTERS: StratFilters = {
    map: "",
    side: "",
    type: "",
    status: "",
    difficulty: "",
    search: "",
    tag: "",
    favoritesOnly: false,
};

const DEFAULT_PAGE_SIZE: PageSize = 50;

export function useStrats(teamId: string, initialFilters?: Partial<StratFilters> | undefined) {
    const { t } = useTranslation();

    const initRef = useRef({ ...DEFAULT_FILTERS, ...initialFilters });

    const [content, setContent] = useState<StratSummaryDto[]>([]);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [filters, setFilters] = useState<StratFilters>(initRef.current);
    const [appliedFilters, setAppliedFilters] = useState<StratFilters>(initRef.current);

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchIdRef = useRef(0);
    const hasContentRef = useRef(false);

    // Debounce search input
    useEffect(() => {
        if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setAppliedFilters(prev => ({ ...prev, search: filters.search }));
        }, 350);
        return () => { if (debounceTimer.current !== null) clearTimeout(debounceTimer.current); };
    }, [filters.search]);

    const loadPage = useCallback(async (f: StratFilters, page: number, size: PageSize) => {
        if (!teamId) return;
        const id = ++fetchIdRef.current;
        if (hasContentRef.current) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        try {
            const data = await getStratsApi(teamId, f, page, size);
            if (id !== fetchIdRef.current) return;
            setContent(data.content);
            setTotalElements(data.totalElements);
            setTotalPages(data.totalPages);
            setCurrentPage(data.page);
            hasContentRef.current = data.content.length > 0;
        } catch {
            toast.error(t("stratbook.load_error"));
        } finally {
            if (id === fetchIdRef.current) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [teamId, t]);

    // Reload when filters change — reset to page 0
    useEffect(() => { loadPage(appliedFilters, 0, pageSize); }, [loadPage, appliedFilters, pageSize]);

    const goToPage = useCallback((page: number) => {
        loadPage(appliedFilters, page, pageSize);
    }, [loadPage, appliedFilters, pageSize]);

    const changePageSize = useCallback((size: PageSize) => {
        setPageSize(size);
    }, []);

    const reload = useCallback(() => loadPage(appliedFilters, currentPage, pageSize), [loadPage, appliedFilters, currentPage, pageSize]);

    // Non-search filter changes bypass debounce
    const updateFilters = useCallback((patch: Partial<StratFilters>) => {
        setFilters(prev => ({ ...prev, ...patch }));
        const { search, ...rest } = patch;
        if (Object.keys(rest).length > 0) {
            if (debounceTimer.current !== null) clearTimeout(debounceTimer.current);
            setAppliedFilters(prev => ({ ...prev, ...rest }));
        }
        void search;
    }, []);

    const createStrat = useCallback(async (payload: CreateStratRequest) => {
        try {
            await createStratApi(teamId, payload);
            toast.success(t("stratbook.create_success"));
            await reload();
            return true;
        } catch { toast.error(t("stratbook.create_error")); return false; }
    }, [teamId, t, reload]);

    const removeStrat = useCallback(async (stratId: number) => {
        try {
            await deleteStratApi(stratId);
            setContent(prev => prev.filter(s => s.id !== stratId));
            setTotalElements(prev => prev - 1);
            toast.success(t("stratbook.delete_success"));
            return true;
        } catch { toast.error(t("stratbook.delete_error")); return false; }
    }, [t]);

    return {
        content, totalElements, totalPages, currentPage, pageSize,
        isLoading, isRefreshing,
        filters, updateFilters,
        goToPage, changePageSize,
        createStrat, removeStrat, reload,
    };
}
