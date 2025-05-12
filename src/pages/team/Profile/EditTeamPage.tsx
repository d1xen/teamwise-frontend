import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TeamEditForm } from "../../../components/layout/TeamEditForm.tsx";
import { useTeamContext } from "../../../context/TeamContext.tsx";

export default function EditTeamPage() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getMembership } = useTeamContext();

    if (!teamId) return <p className="text-white">{t("common.not_found")}</p>;

    const membership = getMembership(teamId);
    const isOwner = membership?.isOwner || false;
    const isStaff = ["MANAGER", "COACH", "OWNER"].includes(membership?.role || "");

    return (
        <div className="py-20 bg-neutral-900 text-white flex justify-center px-4">
            <TeamEditForm
                teamId={teamId}
                isOwner={isOwner}
                isStaff={isStaff}
                onSuccess={() => navigate(`/app/team/${teamId}/profile`)}
            />
        </div>
    );
}
