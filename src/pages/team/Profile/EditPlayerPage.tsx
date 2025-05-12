import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTeamContext } from "../../../context/TeamContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import {PlayerEditForm} from "./PlayerEditForm.tsx";

export default function EditPlayerPage() {
    const { profileId, teamId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const steamId = user?.steamId;
    const { loadMembership, getRole, isLoading } = useTeamContext();

    useEffect(() => {
        if (teamId && steamId) {
            loadMembership(teamId, steamId);
        }
    }, [teamId, steamId, loadMembership]);

    if (!teamId || !profileId) {
        return <p className="text-white">{t("common.not_found")}</p>;
    }

    const currentUserRole = getRole(teamId);
    const isStaff = ["MANAGER", "COACH", "OWNER"].includes(currentUserRole || "");
    const canEdit = isStaff || steamId === profileId;

    if (isLoading) {
        return <p className="text-white">{t("common.loading")}</p>;
    }

    if (!canEdit) {
        return <p className="text-red-500">{t("common.access_denied")}</p>;
    }

    return (
        <div className="py-20 bg-neutral-900 text-white flex justify-center px-4">
            <PlayerEditForm
                profileId={profileId}
                onSuccess={() => navigate(`/app/team/${teamId}/player/${profileId}`)}
            />
        </div>
    );
}
