import { useState, useCallback, useRef, useEffect } from "react";
import { getCalendar } from "@/api/endpoints/agenda.api";
import type { CalendarViewDto, CalendarView, EventType } from "@/api/types/agenda";
import { usePolling } from "@/shared/hooks/usePolling";

// ── Persisted preferences ────────────────────────────────────────────────────

const PREF_KEY = "tw.agenda.prefs";
const POLL_INTERVAL = 20_000;

type AgendaPrefs = {
    view: CalendarView;
    startHour: number;
    endHour: number;
};

const DEFAULT_PREFS: AgendaPrefs = { view: "week", startHour: 10, endHour: 24 };

function loadPrefs(): AgendaPrefs {
    try {
        const raw = localStorage.getItem(PREF_KEY);
        if (!raw) return DEFAULT_PREFS;
        return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_PREFS;
    }
}

function savePrefs(prefs: AgendaPrefs) {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

type UseCalendarResult = {
    data: CalendarViewDto | null;
    isLoading: boolean;
    error: boolean;
    view: CalendarView;
    setView: (v: CalendarView) => void;
    currentDate: Date;
    setCurrentDate: (d: Date) => void;
    filterSteamId: string | null;
    setFilterSteamId: (id: string | null) => void;
    filterEventType: string | null;
    setFilterEventType: (t: string | null) => void;
    startHour: number;
    endHour: number;
    setTimeRange: (startHour: number, endHour: number) => void;
    load: () => void;
};

function getMonthRange(date: Date): { from: string; to: string } {
    const y = date.getFullYear();
    const m = date.getMonth();
    const from = new Date(y, m, 1).toISOString();
    const to = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    return { from, to };
}

function getWeekRange(date: Date): { from: string; to: string } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59);
    return { from: monday.toISOString(), to: sunday.toISOString() };
}

export function useCalendar(teamId: string): UseCalendarResult {
    const [prefs, setPrefs] = useState<AgendaPrefs>(loadPrefs);
    const [data, setData] = useState<CalendarViewDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [filterSteamId, setFilterSteamId] = useState<string | null>(null);
    const [filterEventType, setFilterEventType] = useState<string | null>(null);

    // Stable key that changes only when the user navigates or changes filters
    const dateTs = currentDate.getTime();
    const viewKey = prefs.view;

    const updatePrefs = (patch: Partial<AgendaPrefs>) => {
        setPrefs(prev => {
            const next = { ...prev, ...patch };
            savePrefs(next);
            return next;
        });
    };

    // Core fetch — reads current state via refs to avoid dep cycles
    const fetchRef = useRef<() => Promise<void>>(undefined);
    fetchRef.current = async () => {
        const range = viewKey === "month" ? getMonthRange(currentDate) : getWeekRange(currentDate);
        // "UNAVAILABLE" is a client-side filter, don't send to backend
        const apiEventType = filterEventType && filterEventType !== "UNAVAILABLE"
            ? filterEventType as EventType
            : undefined;
        const result = await getCalendar(
            teamId, range.from, range.to,
            filterSteamId ?? undefined,
            apiEventType
        );
        setData(result);
    };

    // Load on mount + when params change
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(false);
        fetchRef.current!()
            .then(() => { if (!cancelled) setError(false); })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setIsLoading(false); });
        return () => { cancelled = true; };
    }, [teamId, viewKey, dateTs, filterSteamId, filterEventType]);

    // Silent polling — no loading state
    usePolling(() => { fetchRef.current!().catch(() => {}); }, POLL_INTERVAL, !isLoading);

    // Manual reload (after create/delete)
    const load = useCallback(() => {
        fetchRef.current!()
            .catch(() => {});
    }, []);

    return {
        data, isLoading, error,
        view: prefs.view,
        setView: (v) => updatePrefs({ view: v }),
        currentDate, setCurrentDate,
        filterSteamId, setFilterSteamId,
        filterEventType, setFilterEventType,
        startHour: prefs.startHour,
        endHour: prefs.endHour,
        setTimeRange: (s, e) => updatePrefs({ startHour: s, endHour: e }),
        load,
    };
}
