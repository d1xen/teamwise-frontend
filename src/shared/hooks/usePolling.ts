import { useEffect, useRef, useCallback } from "react";

/**
 * Calls `fn` at a regular interval and when the tab regains focus.
 * The function is called silently (no loading state).
 * Automatically pauses when the tab is hidden.
 */
export function usePolling(fn: () => void, intervalMs: number, enabled = true) {
    const fnRef = useRef(fn);
    fnRef.current = fn;

    const poll = useCallback(() => fnRef.current(), []);

    useEffect(() => {
        if (!enabled) return;

        const handleVisibility = () => {
            if (document.visibilityState === "visible") poll();
        };

        const interval = setInterval(() => {
            if (document.visibilityState === "visible") poll();
        }, intervalMs);

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [poll, intervalMs, enabled]);
}
