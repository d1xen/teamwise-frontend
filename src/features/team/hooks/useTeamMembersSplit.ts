import { useMemo } from "react";
import type { TeamMember } from "@/contexts/team/team.types.ts";

export function useTeamMembersSplit(members: TeamMember[]) {
    const players = useMemo(
        () => members.filter((m) => m.role === "PLAYER"),
        [members]
    );

    const staff = useMemo(
        () => members.filter((m) => m.role !== "PLAYER"),
        [members]
    );

    return { players, staff };
}
