import { useState, useEffect, useRef } from "react";
import { getMatches } from "@/api/endpoints/match.api";
import type { MatchSummaryDto } from "@/api/types/match";

const REFRESH_INTERVAL_MS = 90_000;

export function useMatchSummary(teamId: string) {
    const [summary, setSummary] = useState<MatchSummaryDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const cancelRef = useRef(false);

    useEffect(() => {
        if (!teamId) return;

        cancelRef.current = false;

        const doFetch = () => {
            setIsLoading(true);
            getMatches(teamId)
                .then(data => { if (!cancelRef.current) setSummary(data); })
                .catch(() => { if (!cancelRef.current) setSummary(null); })
                .finally(() => { if (!cancelRef.current) setIsLoading(false); });
        };

        doFetch();

        const handleVisibility = () => {
            if (document.visibilityState === "visible") doFetch();
        };

        document.addEventListener("visibilitychange", handleVisibility);
        const interval = setInterval(doFetch, REFRESH_INTERVAL_MS);

        return () => {
            cancelRef.current = true;
            document.removeEventListener("visibilitychange", handleVisibility);
            clearInterval(interval);
        };
    }, [teamId]);

    return {
        summary,
        isLoading,
        hasData: summary !== null,
        nextMatch: summary?.upcoming[0] ?? null,
        toCompleteCount: summary?.toComplete.active.length ?? 0,
        completedCount: summary?.completed.length ?? 0,
    };
}
