import { useContext } from "react";
import { TeamContext } from "@/contexts/team/team.context.ts";
import type { TeamContextType } from "@/contexts/team/team.types.ts";

export function useTeam(): TeamContextType {
    const ctx = useContext(TeamContext);
    if (!ctx) {
        throw new Error("useTeam must be used within TeamProvider");
    }
    return ctx;
}

