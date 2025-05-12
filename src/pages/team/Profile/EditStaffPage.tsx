import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTeamContext } from "../../../context/TeamContext.tsx";
import { useAuth } from "../../../context/AuthContext.tsx";
import {StaffEditForm} from "./StaffEditForm.tsx";

export default function EditStaffPage() {
    const { teamId, id: profileId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { getRole, isOwner, loadMembership, isLoading } = useTeamContext();

    useEffect(() => {
        if (teamId && user?.steamId) {
            loadMembership(teamId, user.steamId);
        }
    }, [teamId, user?.steamId, loadMembership]);

    if (!teamId || !profileId) {
        return <p className="text-white">{t("common.not_found")}</p>;
    }

    const currentUserRole = getRole(teamId);
    const canEdit =
        isOwner(teamId) ||
        currentUserRole === "MANAGER" ||
        user?.steamId === profileId;

    if (isLoading) {
        return <p className="text-white">{t("common.loading")}</p>;
    }

    if (!canEdit) {
        return <p className="text-red-500">{t("common.access_denied")}</p>;
    }

    return (
        <div className="py-20 bg-neutral-900 text-white flex justify-center px-4">
            <StaffEditForm
                profileId={profileId}
                onSuccess={() => navigate(`/app/team/${teamId}/profile/staff/${profileId}`)}
            />
        </div>
    );
}
