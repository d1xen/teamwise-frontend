import { useState, useEffect, useCallback } from "react";
import { getMySchedule } from "@/api/endpoints/agenda.api";
import type { EventDto } from "@/api/types/agenda";
import { usePolling } from "@/shared/hooks/usePolling";

export function useMySchedule(teamId: string) {
    const [events, setEvents] = useState<EventDto[]>([]);

    const load = useCallback(async () => {
        try {
            setEvents(await getMySchedule(teamId, 20));
        } catch {
            // silent
        }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);
    usePolling(load, 30_000, true);

    return { events, reload: load };
}
