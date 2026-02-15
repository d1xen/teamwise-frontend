import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth.ts";
import { getMyTeams } from "@/api/endpoints/team.api";

type Team = {
    id: number;
    name: string;
    tag: string;
};

export function useTeamSelection() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect non-authenticated users
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthLoading, isAuthenticated, navigate]);

    // Load teams
    useEffect(() => {
        if (isAuthLoading || !isAuthenticated) {
            return;
        }

        let cancelled = false;

        setIsLoading(true);
        setError(null);

        getMyTeams()
            .then((data) => {
                if (!cancelled) {
                    setTeams(
                        data.map((team) => ({
                            id: team.id,
                            name: team.name,
                            tag: team.tag ?? "",
                        }))
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Unable to load your teams");
                    setTeams([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthLoading, isAuthenticated]);

    const selectTeam = (teamId: number) => {
        if (!user) return;

        if (!user.profileCompleted) {
            navigate("/complete-profile", {
                state: { fromTeamId: teamId },
            });
        } else {
            navigate(`/team/${teamId}/team`);
        }
    };

    return {
        teams,
        isLoading: isAuthLoading || isLoading,
        error,
        selectTeam,
    };
}
