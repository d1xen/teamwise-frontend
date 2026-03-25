import { useState, useEffect, useCallback, useRef } from "react";
import { getMatches } from "@/api/endpoints/match.api";
import type { MatchSummaryDto } from "@/api/types/match";
import { usePolling } from "@/shared/hooks/usePolling";

// Lightweight event bus so all useMatchSummary instances refresh together
const listeners = new Set<() => void>();
export function invalidateMatchSummary() {
    listeners.forEach(fn => fn());
}

export function useMatchSummary(teamId: string) {
    const [summary, setSummary] = useState<MatchSummaryDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const cancelRef = useRef(false);

    const doFetch = useCallback(() => {
        if (!teamId) return;
        getMatches(teamId)
            .then(data => { if (!cancelRef.current) setSummary(data); })
            .catch(() => { if (!cancelRef.current) setSummary(null); })
            .finally(() => { if (!cancelRef.current) setIsLoading(false); });
    }, [teamId]);

    useEffect(() => {
        if (!teamId) return;
        cancelRef.current = false;
        setIsLoading(true);
        doFetch();
        return () => { cancelRef.current = true; };
    }, [teamId, doFetch]);

    // Subscribe to invalidation events
    useEffect(() => {
        listeners.add(doFetch);
        return () => { listeners.delete(doFetch); };
    }, [doFetch]);

    usePolling(doFetch, 60_000, !!teamId);

    return {
        summary,
        isLoading,
        hasData: summary !== null,
        nextMatch: summary?.upcoming[0] ?? null,
        toCompleteCount: summary?.toComplete.active.length ?? 0,
        completedCount: summary?.completed.length ?? 0,
    };
}
