import { useParams } from "react-router-dom";

export function useTeamId(): string {
    const { teamId } = useParams();

    if (!teamId) {
        throw new Error("teamId is required but was not found in URL.");
    }

    return teamId;
}
