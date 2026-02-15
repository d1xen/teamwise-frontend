import { useContext } from "react";
import { AgendaContext } from "@/contexts/agenda/agenda.context.ts";
import type { AgendaContextType } from "@/contexts/agenda/agenda.context.ts";

export function useAgenda(): AgendaContextType {
    const context = useContext(AgendaContext);
    if (!context) {
        throw new Error("useAgenda must be used within AgendaProvider");
    }
    return context;
}

