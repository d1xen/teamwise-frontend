import { useState, useEffect, useCallback } from "react";
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

export function useCompetitions(teamId: string) {
    const { t } = useTranslation();

    const [competitions, setCompetitions] = useState<CompetitionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<CompetitionTab>("active");

    const load = useCallback(async () => {
        if (!teamId) return;
        try {
            const data = await getCompetitionsApi(teamId);
            setCompetitions(data);
        } catch {
            toast.error(t("competitions.load_error"));
        } finally {
            setIsLoading(false);
        }
    }, [teamId, t]);

    useEffect(() => {
        setIsLoading(true);
        load();
    }, [load]);

    const filtered = competitions.filter((c) => {
        if (tab === "active") return c.status === "UPCOMING" || c.status === "ONGOING";
        if (tab === "completed") return c.status === "COMPLETED" || c.status === "CANCELLED";
        return true;
    });

    const createCompetition = useCallback(async (payload: CreateCompetitionRequest) => {
        try {
            const created = await createCompetitionApi(teamId, payload);
            setCompetitions((prev) => [created, ...prev]);
            toast.success(t("competitions.created"));
            return true;
        } catch {
            toast.error(t("competitions.create_error"));
            return false;
        }
    }, [teamId, t]);

    const updateCompetition = useCallback(async (competitionId: number, payload: UpdateCompetitionRequest) => {
        try {
            const updated = await updateCompetitionApi(teamId, competitionId, payload);
            setCompetitions((prev) => prev.map((c) => (c.id === competitionId ? updated : c)));
            toast.success(t("competitions.updated"));
            return true;
        } catch {
            toast.error(t("competitions.update_error"));
            return false;
        }
    }, [teamId, t]);

    const removeCompetition = useCallback(async (competitionId: number) => {
        try {
            await deleteCompetitionApi(teamId, competitionId);
            setCompetitions((prev) => prev.filter((c) => c.id !== competitionId));
            toast.success(t("competitions.deleted"));
            return true;
        } catch {
            toast.error(t("competitions.delete_error"));
            return false;
        }
    }, [teamId, t]);

    const bulkDeleteCompetitions = useCallback(async (ids: number[]) => {
        const results = await Promise.allSettled(
            ids.map((id) => deleteCompetitionApi(teamId, id))
        );
        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - succeeded;
        if (succeeded > 0) {
            setCompetitions((prev) => prev.filter((c) => !ids.includes(c.id)));
            toast.success(t("competitions.bulk_delete_success", { count: succeeded }));
        }
        if (failed > 0) {
            toast.error(t("competitions.bulk_delete_error"));
        }
    }, [teamId, t]);

    const counts = {
        active: competitions.filter((c) => c.status === "UPCOMING" || c.status === "ONGOING").length,
        completed: competitions.filter((c) => c.status === "COMPLETED" || c.status === "CANCELLED").length,
        all: competitions.length,
    };

    return {
        competitions: filtered,
        isLoading,
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
