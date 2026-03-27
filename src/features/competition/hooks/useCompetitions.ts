import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type {
    CompetitionDto,
    CompetitionTab,
    CreateCompetitionRequest,
    UpdateCompetitionRequest,
} from "@/api/types/competition";
import {
    getCompetitions as getCompetitionsApi,
    createCompetition as createCompetitionApi,
    updateCompetition as updateCompetitionApi,
    deleteCompetition as deleteCompetitionApi,
} from "@/api/endpoints/competition.api";

// Lightweight event bus — match mutations trigger competition refresh (matchRecord updates)
const listeners = new Set<() => void>();
export function invalidateCompetitions() {
    listeners.forEach(fn => fn());
}

export function useCompetitions(teamId: string) {
    const { t } = useTranslation();

    const [competitions, setCompetitions] = useState<CompetitionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [tab, setTab] = useState<CompetitionTab>("active");
    const hasContentRef = useRef(false);

    const load = useCallback(async () => {
        if (!teamId) return;
        if (hasContentRef.current) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        try {
            const data = await getCompetitionsApi(teamId);
            setCompetitions(data);
            hasContentRef.current = data.length > 0;
        } catch {
            toast.error(t("competitions.load_error"));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [teamId, t]);

    useEffect(() => { load(); }, [load]);

    // Subscribe to cross-module invalidation (e.g., match mutations update matchRecord)
    const loadRef = useRef(load);
    loadRef.current = load;
    useEffect(() => {
        const handler = () => { if (hasContentRef.current) loadRef.current(); };
        listeners.add(handler);
        return () => { listeners.delete(handler); };
    }, []);

    // Re-fetch when tab regains focus (user navigates back)
    useEffect(() => {
        const handleFocus = () => { if (hasContentRef.current) load(); };
        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [load]);

    const filtered = competitions.filter((c) => {
        if (tab === "active") return c.status === "UPCOMING" || c.status === "ONGOING";
        if (tab === "completed") return c.status === "COMPLETED" || c.status === "CANCELLED";
        return true;
    });

    const createCompetition = useCallback(async (payload: CreateCompetitionRequest) => {
        try {
            await createCompetitionApi(teamId, payload);
            toast.success(t("competitions.created"));
            await load();
            return true;
        } catch {
            toast.error(t("competitions.create_error"));
            return false;
        }
    }, [teamId, t, load]);

    const updateCompetition = useCallback(async (competitionId: number, payload: UpdateCompetitionRequest) => {
        try {
            await updateCompetitionApi(teamId, competitionId, payload);
            toast.success(t("competitions.updated"));
            await load();
            return true;
        } catch {
            toast.error(t("competitions.update_error"));
            return false;
        }
    }, [teamId, t, load]);

    const removeCompetition = useCallback(async (competitionId: number) => {
        try {
            await deleteCompetitionApi(teamId, competitionId);
            toast.success(t("competitions.deleted"));
            await load();
            return true;
        } catch {
            toast.error(t("competitions.delete_error"));
            return false;
        }
    }, [teamId, t, load]);

    const bulkDeleteCompetitions = useCallback(async (ids: number[]) => {
        const results = await Promise.allSettled(
            ids.map((id) => deleteCompetitionApi(teamId, id))
        );
        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - succeeded;
        if (succeeded > 0) {
            toast.success(t("competitions.bulk_delete_success", { count: succeeded }));
        }
        if (failed > 0) {
            toast.error(t("competitions.bulk_delete_error"));
        }
        await load();
    }, [teamId, t, load]);

    const counts = {
        active: competitions.filter((c) => c.status === "UPCOMING" || c.status === "ONGOING").length,
        completed: competitions.filter((c) => c.status === "COMPLETED" || c.status === "CANCELLED").length,
        all: competitions.length,
    };

    return {
        competitions: filtered,
        isLoading,
        isRefreshing,
        tab,
        setTab,
        counts,
        createCompetition,
        updateCompetition,
        removeCompetition,
        bulkDeleteCompetitions,
        reload: load,
    };
}
