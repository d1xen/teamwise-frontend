import {  useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader";
import { TeamPlayersSection } from "./Profile/TeamPlayersSection.tsx";
import { FaTwitter} from "react-icons/fa";
import hltvIcon from "../../assets/hltv.png";
import faceitIcon from "../../assets/faceit.svg";
import i18n from "i18next";

interface Player {
    id: number;
    nickname: string;
    playerPictureUrl: string;
    nationality: string;
    age: number;
}

interface TeamData {
    id: number;
    name: string;
    tag: string;
    logoUrl?: string;
    game: string;
    faceitUrl?: string;
    hltvUrl?: string;
    twitterUrl?: string;
    players: Player[];
}

export default function TeamPage() {
    const { teamId } = useParams();
    const { t } = useTranslation();

    const [team, setTeam] = useState<TeamData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!teamId) return;

        const loadTeamData = async () => {
            try {
                const [teamRes, playersRes] = await Promise.all([
                    fetch(`/api/teams/${teamId}`),
                    fetch(`/api/teams/${teamId}/players`)
                ]);

                const teamData = await teamRes.json();
                const playersData = await playersRes.json();

                setTeam({ ...teamData, players: playersData });
            } catch (err) {
                console.error("Erreur de chargement :", err);
            } finally {
                setLoading(false);
            }
        };

        loadTeamData();
    }, [teamId]);

    if (loading || !team) return <Loader />;

    const averageAge = team.players.length > 0
        ? team.players.reduce((sum, p) => sum + (p.age || 0), 0) / team.players.length
        : null;

    const formattedAverageAge = averageAge !== null
        ? new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(averageAge)
        : null;

    return (
        <div className="max-w-5xl mx-auto mt-16 px-4 text-white">
            <div className="bg-neutral-800 rounded-xl shadow-lg p-6 relative">

                {/* Line-up */}
                <TeamPlayersSection players={team.players}/>

                {/* Logo + nom & tag */}
                <div className="flex items-center gap-4 mb-6">
                    {team.logoUrl && (
                        <img
                            src={`http://localhost:8080${team.logoUrl}`}
                            alt={`${team.name} logo`}
                            className="w-28 h-28 object-contain rounded-md "
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-white">{team.name}</h1>
                        <p className="text-indigo-400 font-medium text-lg">{team.tag}</p>
                        {/* Icônes sociales */}
                        <div className="flex items-center gap-4 mt-2">
                            {team.faceitUrl && (
                                <a
                                    href={team.faceitUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="FACEIT"
                                    className="w-4 h-4 transition-transform transform hover:scale-110 text-white hover:text-indigo-400"
                                >
                                    <img
                                        src={faceitIcon}
                                        alt="FaceIt"
                                        className="w-4 h-4 rounded-sm"
                                    />
                                </a>
                            )}

                            {team.hltvUrl && (
                                <a
                                    href={team.hltvUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="HLTV"
                                    className="w-4 h-4 transition-transform transform hover:scale-110"
                                >
                                    <img
                                        src={hltvIcon}
                                        alt="HLTV"
                                        className="w-4 h-4 rounded-sm"
                                    />
                                </a>
                            )}

                            {team.twitterUrl && (
                                <a
                                    href={team.twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Twitter"
                                    className="w-4 h-4 text-white transition-transform transform hover:scale-110"
                                >
                                    <FaTwitter/>
                                </a>
                            )}
                        </div>
                    </div>

                </div>

                {/* Informations générales */}
                <div
                    className="divide-y divide-neutral-700 rounded-md overflow-hidden text-sm text-gray-300 bg-neutral-800"
                >
                    <div className="flex justify-between px-4 py-3">
                        <span className="font-medium">Coach</span>
                        <span className="italic text-gray-500">{t("team.coach_coming_soon")}</span>
                    </div>
                    {formattedAverageAge && (
                        <div className="flex justify-between px-4 py-3">
                            <span className="font-medium">{t("team.average_age")}</span>
                            <span>{t("common.age_display", {age: formattedAverageAge})}</span>
                        </div>
                    )}
                    <div className="flex justify-between px-4 py-3">
                        <span className="font-medium">{t("team.game")}</span>
                        <span>{team.game}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
