import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import { getMyTeams } from "@/api/endpoints/team.api";
import type { TeamDto } from "@/api/types/team";
import Loader from "@/shared/components/Loader";

type Team = {
    id: number;
    name: string;
    tag: string;
};

export default function SelectTeamPage() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* ======================
       AUTH GUARD
       ====================== */

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthLoading, isAuthenticated, navigate]);

    /* ======================
       LOAD TEAMS
       ====================== */

    useEffect(() => {
        if (isAuthLoading || !isAuthenticated) {
            return;
        }

        let cancelled = false;

        setIsLoading(true);
        setError(null);

        getMyTeams()
            .then((teams: TeamDto[]) => {
                if (!cancelled) {
                    setTeams(
                        teams.map((team) => ({
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

    /* ======================
       LOADING
       ====================== */

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <Loader />
            </div>
        );
    }

    /* ======================
       HANDLERS
       ====================== */

    const handleTeamClick = (teamId: number) => {
        if (!user) {
            return;
        }

        if (!user.profileCompleted) {
            navigate("/complete-profile", {
                state: { fromTeamId: teamId },
            });
        } else {
            navigate(`/team/${teamId}/team`);
        }
    };

    /* ======================
       RENDER
       ====================== */

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white px-4">
            <div className="w-full max-w-md space-y-6 bg-neutral-800 rounded-xl p-6">
                <h1 className="text-2xl font-semibold text-center">
                    Select your team
                </h1>

                {error && (
                    <div className="text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                {teams.length === 0 ? (
                    <p className="text-center text-gray-400">
                        You don’t belong to any team yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {teams.map((team) => (
                            <button
                                key={team.id}
                                onClick={() => handleTeamClick(team.id)}
                                className="w-full px-4 py-3 bg-neutral-700 rounded hover:bg-neutral-600 text-left transition"
                            >
                                <div className="font-medium">
                                    {team.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                    [{team.tag}]
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => navigate("/team/create")}
                    className="w-full px-4 py-3 bg-indigo-600 rounded hover:bg-indigo-500 transition"
                >
                    Create a new team
                </button>
            </div>
        </div>
    );
}
