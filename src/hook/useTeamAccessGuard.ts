import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { limitedToast as toast } from "../utils/limitedToast";
import { useRequiredUser } from "../context/AuthContext.tsx";
import { useTranslation } from "react-i18next";

export function useTeamAccessGuard(teamId?: string | number) {
    const user = useRequiredUser();
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        fetch(`/api/teams/${teamId}?steamId=${user.steamId}`)
            .then(res => {
                if (!res.ok) {
                    if (res.status === 403 || res.status === 404) {
                        toast.error(t("guard.access_denied"));
                        navigate("/home");
                    }
                    throw new Error(t("guard.error"));
                }
            });
    }, [teamId, user, navigate, t]);
}
