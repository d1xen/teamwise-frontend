import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import { useRequiredUser} from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";
import faceitIcon from "../../assets/faceit.svg";
import hltvIcon from "../../assets/hltv.png";
import { FaTwitter, FaDiscord } from "react-icons/fa";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import frLocale from "i18n-iso-countries/langs/fr.json";
import Loader from "../../components/ui/Loader.tsx";

countries.registerLocale(enLocale);
countries.registerLocale(frLocale);

interface Player {
    id: number;
    nickname: string;
    firstName: string;
    lastName: string;
    nationality: string;
    age: number;
    playerPictureUrl: string;
    inGameRole: string;
    captain: boolean;
    twitter?: string;
    discord?: string;
    faceit?: string;
    hltvProfileUrl?: string;
}

export default function PlayersPage() {
    const { t, i18n } = useTranslation();
    const user = useRequiredUser();
    const { teamId } = useParams();
    const [players, setPlayers] = useState<Player[]>([]);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useTeamAccessGuard(teamId);

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        setIsLoading(true);

        fetch(`/api/teams/${teamId}/players`)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setPlayers(data);
                else throw new Error("Invalid data format");
            })
            .catch(() => toast.error(t("players.fetch_error")))
            .finally(() => setIsLoading(false));
    }, [teamId, user, t]);

    const getAgeLabel = (age: number) => {
        return `${t("common.years_old", { count: age })}`;
    };

    const getCountryName = (code: string) => {
        return countries.getName(code, i18n.language, { select: "official" }) || code;
    };

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">{t("players.title")}</h1>

                {isLoading ? (
                    <div className="flex justify-center mt-12">
                        <Loader />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    onClick={() => navigate(`/app/team/${teamId}/profile/player/${player.id}`)}
                                    className="bg-neutral-800 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:bg-neutral-700 transition flex flex-col justify-start h-auto"
                                >
                                    <img
                                        src={player.playerPictureUrl}
                                        alt={player.nickname}
                                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border border-neutral-600"
                                    />
                                    <div className="text-left">
                                        <h2 className="text-lg font-bold truncate flex items-center gap-2">
                                            {player.nickname}
                                            {player.captain && (
                                                <span
                                                    title={t("players.captain")}
                                                    className="w-4 h-4 flex items-center justify-center rounded-full bg-yellow-400 text-black text-[10px] leading-none"
                                                >
                                                    C
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-sm text-gray-400 truncate">
                                            {player.firstName} {player.lastName}
                                        </p>
                                        <p className="text-xs text-indigo-300 font-medium mt-1 truncate">
                                            {player.inGameRole
                                                ? t(`roles.${player.inGameRole}`).toUpperCase()
                                                : `${t("players.role_label")} ${t("roles.TBD")}`}
                                        </p>
                                        <div
                                            className="mt-2 flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-300">
                                        <span title={getCountryName(player.nationality)}>
                                            <Flag
                                                code={player.nationality}
                                                style={{width: 18, height: 14, borderRadius: 2}}
                                            />
                                        </span>
                                            <span>{getAgeLabel(player.age)}</span>
                                        </div>
                                        <div
                                            className="mt-3 flex flex-row-reverse items-center gap-3 text-white text-base">
                                            {player.faceit && (
                                                <a
                                                    href={player.faceit}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <img
                                                        src={faceitIcon}
                                                        alt="FACEIT"
                                                        title="FACEIT"
                                                        className="w-4 h-4"
                                                    />
                                                </a>
                                            )}

                                            {player.hltvProfileUrl && (
                                                <a
                                                    href={player.hltvProfileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <img
                                                        src={hltvIcon}
                                                        alt="HLTV"
                                                        title="HLTV"
                                                        className="w-4 h-4 rounded-sm"
                                                    />
                                                </a>
                                            )}

                                            {player.twitter && (
                                                <a
                                                    href={player.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <FaTwitter title="Twitter"/>
                                                </a>
                                            )}

                                            {player.discord && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(player.discord || "");
                                                        toast.success("Pseudo Discord copié !");
                                                    }}
                                                    title="Copier le pseudo Discord"
                                                    className="w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer"
                                                >
                                                    <FaDiscord/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {players.length === 0 && (
                            <p className="text-center text-gray-500 mt-8">{t("players.none_found")}</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );

}
