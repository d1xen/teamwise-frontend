import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Pencil } from "lucide-react";
import { useTeamContext } from "../../context/TeamContext";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader";

export default function TeamPage() {
    const { teamId } = useParams();
    const { getMembership } = useTeamContext();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const membership = teamId ? getMembership(teamId) : null;
    const canEdit = useMemo(() => membership?.isOwner || membership?.role === "MANAGER", [membership]);

    useEffect(() => {
        if (!teamId) return;
        fetch(`/api/teams/${teamId}`)
            .then(res => res.json())
            .then(setTeam)
            .finally(() => setLoading(false));
    }, [teamId]);

    if (loading || !team) return <Loader />;

    return (
        <div className="max-w-4xl mx-auto mt-16 px-4 text-white">
            <div className="bg-neutral-800 rounded-xl shadow-lg p-6 relative">
                {canEdit && (
                    <button
                        onClick={() => navigate("edit")}
                        className="absolute top-4 right-4 text-gray-400 hover:text-indigo-400"
                        title={t("team.edit")}
                    >
                        <Pencil className="w-5 h-5" />
                    </button>
                )}
                <img src={team.logoUrl} alt={team.name} className="w-32 h-32 object-contain mb-4" />
                <h1 className="text-3xl font-bold">{team.name}</h1>
                <p className="text-gray-400">Tag: {team.tag} | Game: {team.game}</p>
                <div className="flex gap-4 mt-4">
                    {team.faceitUrl && <a href={team.faceitUrl}>FACEIT</a>}
                    {team.hltvUrl && <a href={team.hltvUrl}>HLTV</a>}
                    {team.twitterUrl && <a href={team.twitterUrl}>Twitter</a>}
                </div>
            </div>
        </div>
    );
}