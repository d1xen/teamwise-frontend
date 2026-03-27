import { useState, useEffect } from "react";
import type { TFunction } from "i18next";

export type CountdownResult = {
    /** "Dans X jours" or live "HH:MM:SS" */
    label: string;
    /** For styling: high = < 1h, medium = < 24h, low = > 24h */
    urgency: "high" | "medium" | "low";
    /** True when showing live countdown (< 24h) */
    isLive: boolean;
    /** True when time has passed */
    isPast: boolean;
};

function pad(n: number): string {
    return n.toString().padStart(2, "0");
}

function compute(targetIso: string, t: TFunction): CountdownResult {
    const diff = new Date(targetIso).getTime() - Date.now();

    if (diff <= 0) {
        return { label: "", urgency: "high", isLive: false, isPast: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);

    // > 24h → "Dans X jours"
    if (days >= 1) {
        return {
            label: t("matches.in_days", { count: days }),
            urgency: days < 7 ? "medium" : "low",
            isLive: false,
            isPast: false,
        };
    }

    // < 24h → live countdown HH:MM:SS
    const h = totalHours;
    const m = totalMinutes % 60;
    const s = totalSeconds % 60;
    const timer = `${pad(h)}:${pad(m)}:${pad(s)}`;

    return {
        label: timer,
        urgency: totalHours < 1 ? "high" : "medium",
        isLive: true,
        isPast: false,
    };
}

/**
 * Returns a live countdown for upcoming matches.
 * - > 24h: static "Dans X jours"
 * - < 24h: live "HH:MM:SS" updated every second
 */
export function useCountdown(targetIso: string | null | undefined, t: TFunction): CountdownResult | null {
    const [result, setResult] = useState<CountdownResult | null>(() =>
        targetIso ? compute(targetIso, t) : null
    );

    useEffect(() => {
        if (!targetIso) { setResult(null); return; }

        // Initial compute
        const r = compute(targetIso, t);
        setResult(r);

        // Only tick if live countdown
        if (!r.isLive && !r.isPast) return;

        const interval = setInterval(() => {
            setResult(compute(targetIso, t));
        }, 1000);

        return () => clearInterval(interval);
    }, [targetIso, t]);

    return result;
}
