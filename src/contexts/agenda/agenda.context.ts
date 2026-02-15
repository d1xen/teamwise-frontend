import { createContext } from "react";
import type { AgendaEvent } from "@/contexts/agenda/agenda.types.ts";

type AgendaContextType = {
    events: AgendaEvent[];
    isLoading: boolean;
    reload: () => void;
};

export const AgendaContext = createContext<AgendaContextType | undefined>(undefined);
export type { AgendaContextType };

