import { useEffect, useState, useCallback } from "react";
import { useTeam } from "@/contexts/team/useTeam.ts";
import type { AgendaEvent } from "@/contexts/agenda/agenda.types.ts";
import { AgendaContext } from "@/contexts/agenda/agenda.context.ts";

export function AgendaProvider({ children }: { children: React.ReactNode }) {
    const { team } = useTeam();
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadAgenda = useCallback(() => {
        if (!team) return;

        setIsLoading(true);
        fetch(`/api/teams/${team.id}/agenda`)
            .then((res) => (res.ok ? res.json() : []))
            .then(setEvents)
            .catch(() => setEvents([]))
            .finally(() => setIsLoading(false));
    }, [team]);

    useEffect(() => {
        loadAgenda();
    }, [loadAgenda]);

    return (
        <AgendaContext.Provider
            value={{
                events,
                isLoading,
                reload: loadAgenda,
            }}
        >
            {children}
        </AgendaContext.Provider>
    );
}
