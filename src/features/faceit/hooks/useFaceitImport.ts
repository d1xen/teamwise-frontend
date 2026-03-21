import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { importFaceitMatches, deimportFaceitMatches } from "@/api/endpoints/faceit.api";
import type { FaceitImportResultDto } from "@/api/types/faceit";

export type UseFaceitImportReturn = {
    selected: Set<string>;
    toggle: (competitionId: string) => void;
    clearSelection: () => void;
    isImporting: boolean;
    /** Imports match IDs and returns the result (or null on error). */
    importSelected: (teamId: string, matchIds: string[]) => Promise<FaceitImportResultDto | null>;
    /** De-imports (removes) match IDs for a single competition. Returns removed IDs on success, null on error. */
    deimport: (teamId: string, matchIds: string[]) => Promise<string[] | null>;
    deimportingId: string | null;
    setDeimportingId: (id: string | null) => void;
};

export function useFaceitImport(): UseFaceitImportReturn {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [deimportingId, setDeimportingId] = useState<string | null>(null);

    const toggle = (competitionId: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(competitionId)) next.delete(competitionId);
            else next.add(competitionId);
            return next;
        });
    };

    const clearSelection = () => setSelected(new Set());

    const importSelected = async (
        teamId: string,
        matchIds: string[]
    ): Promise<FaceitImportResultDto | null> => {
        if (matchIds.length === 0 || isImporting) return null;
        setIsImporting(true);
        try {
            const result = await importFaceitMatches(teamId, matchIds);
            if (result.imported > 0) {
                toast.success(t("faceit.import_success", { count: result.imported }));
            }
            if (result.failed > 0) {
                toast.error(t("faceit.import_error_partial", { count: result.failed }));
            }
            setSelected(new Set());
            return result;
        } catch {
            toast.error(t("faceit.import_error"));
            return null;
        } finally {
            setIsImporting(false);
        }
    };

    const deimport = async (
        teamId: string,
        matchIds: string[]
    ): Promise<string[] | null> => {
        if (matchIds.length === 0) return null;
        try {
            const result = await deimportFaceitMatches(teamId, matchIds);
            if (result.removed > 0) {
                toast.success(t("faceit.deimport_success", { count: result.removed }));
            }
            return matchIds;
        } catch {
            toast.error(t("faceit.deimport_error"));
            return null;
        }
    };

    return { selected, toggle, clearSelection, isImporting, importSelected, deimport, deimportingId, setDeimportingId };
}
