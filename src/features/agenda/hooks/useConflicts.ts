import { useState, useEffect, useCallback } from "react";
import { getConflicts } from "@/api/endpoints/agenda.api";
import type { ConflictSummaryDto } from "@/api/types/agenda";
import { usePolling } from "@/shared/hooks/usePolling";

export function useConflicts(teamId: string) {
    const [conflicts, setConflicts] = useState<ConflictSummaryDto[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    const load = useCallback(async () => {
        try {
            const all = await getConflicts(teamId);
            setTotalCount(all.length);
            setConflicts(all);
        } catch {
            // silent
        }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);
    usePolling(load, 30_000, true);

    return { conflicts, totalCount, reload: load };
}
