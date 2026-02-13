import { createContext, useContext, useEffect, useState } from "react";
import { useTeam } from "./TeamContext";

export interface AgendaEvent {
    id: string;
    title: string;
    type: "MATCH" | "SCRIM" | "PRACTICE";
    startsAt: string;
    endsAt?: string;
    description?: string;
}

interface AgendaContextType {
    events: AgendaEvent[];
    isLoading: boolean;
    reload: () => void;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export function useAgenda() {
    const context = useContext(AgendaContext);
    if (!context) {
        throw new Error("useAgenda must be used within AgendaProvider");
    }
    return context;
}

export function AgendaProvider({ children }: { children: React.ReactNode }) {
    const { team } = useTeam();
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadAgenda = () => {
        if (!team) return;

        setIsLoading(true);
        fetch(`/api/teams/${team.id}/agenda`)
            .then((res) => (res.ok ? res.json() : []))
            .then(setEvents)
            .catch(() => setEvents([]))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadAgenda();
    }, [team?.id]);

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
