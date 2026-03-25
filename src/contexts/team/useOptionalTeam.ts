import { useContext } from "react";
import { TeamContext } from "@/contexts/team/team.context.ts";

export function useOptionalTeam() {
    const ctx = useContext(TeamContext);
    return {
        team: ctx?.team ?? null,
        refreshTeam: ctx?.refreshTeam,
    };
}

