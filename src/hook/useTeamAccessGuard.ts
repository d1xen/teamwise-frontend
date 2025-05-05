// hooks/useTeamAccessGuard.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { limitedToast as toast } from "../utils/limitedToast";
import { useAuth } from "../context/AuthContext";

export function useTeamAccessGuard(teamId?: string | number) {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        fetch(`/api/teams/${teamId}?steamId=${user.steamId}`)
            .then(res => {
                if (!res.ok) {
                    if (res.status === 403 || res.status === 404) {
                        toast.error("Tu n'as pas accès à cette équipe.");
                        navigate("/home");
                    }
                    throw new Error("Accès refusé.");
                }
            });
    }, [teamId, user, navigate]);
}
