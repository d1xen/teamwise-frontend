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
    const fetchRef = useRef<() => void>(() => {});

    const doFetch = useCallback(() => {
        if (!teamId) return;
        getMatches(teamId)
            .then(data => { if (!cancelRef.current) setSummary(data); })
            .catch(() => { if (!cancelRef.current) setSummary(null); })
            .finally(() => { if (!cancelRef.current) setIsLoading(false); });
    }, [teamId]);

    // Keep ref in sync for listener/polling (avoids dependency issues)
    fetchRef.current = doFetch;

    // Single fetch on mount / teamId change
    useEffect(() => {
        if (!teamId) return;
        cancelRef.current = false;
        setIsLoading(true);
        fetchRef.current();
        return () => { cancelRef.current = true; };
    }, [teamId]);

    // Subscribe to invalidation events via stable ref
    useEffect(() => {
        const handler = () => fetchRef.current();
        listeners.add(handler);
        return () => { listeners.delete(handler); };
    }, []);

    usePolling(() => fetchRef.current(), 60_000, !!teamId);

    return {
        summary,
        isLoading,
        hasData: summary !== null,
        nextMatch: summary?.upcoming[0] ?? null,
        toCompleteCount: summary?.toComplete.active.length ?? 0,
        completedCount: summary?.completed.length ?? 0,
    };
}
