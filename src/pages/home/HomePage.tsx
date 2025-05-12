import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/layout/AppHeader.tsx";
import { useAuth } from "../../context/AuthContext.tsx";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader.tsx";
import { TeamCard } from "../../components/ui/TeamCard.tsx";

export interface Team {
    id: number;
    name: string;
    tag: string;
    logoUrl?: string;
}

export default function HomePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [joinUrl, setJoinUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    const hasReachedTeamLimit = teams.length >= 3;

    const fetchTeams = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/teams/by-user?steamId=${user.steamId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTeams(data);
                if (!localStorage.getItem("teamId") && data.length > 0) {
                    localStorage.setItem("teamId", String(data[0].id));
                }
            } else {
                setTeams([]);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des équipes :", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [user]);

    const handleJoinTeam = async () => {
        if (!user) return;
        if (hasReachedTeamLimit) {
            toast.info(t("team.limit_reached"));
            return;
        }

        try {
            const res = await fetch(`/api/teams/join-team?steamId=${user.steamId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteUrl: joinUrl })
            });

            if (res.ok) {
                toast.success(t("team.join_success"));
                await fetchTeams();
                setJoinUrl("");
            } else {
                const errorText = await res.text();
                if (errorText.includes("expiré") || errorText.includes("utilisé")) {
                    toast.error(t("team.invite_expired"));
                } else if (errorText.includes("déjà partie")) {
                    toast.info(t("team.already_member"));
                } else {
                    toast.error(t("team.invite_invalid"));
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(t("generic.network_error"));
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen text-white bg-neutral-900 flex flex-col">
            <AppHeader user={user} onLogout={logout} />

            <main className="flex-1 flex flex-col justify-center items-center px-6 py-10">
                <h2 className="text-3xl font-bold text-white mb-8">{t("team.select_title")}</h2>

                {loading ? (
                    <Loader />
                ) : (
                    <>
                        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
                            {teams.map(team => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                />
                            ))}
                            <div
                                onClick={() => {
                                    if (hasReachedTeamLimit) {
                                        toast.info(t("team.limit_reached"));
                                        return;
                                    }
                                    navigate("/app/create-team");
                                }}
                                className={`w-72 h-72 border-2 border-dashed p-6 rounded-2xl transition transform hover:scale-[1.03] hover:ring-2 hover:ring-indigo-500/30 duration-200 flex flex-col justify-center items-center text-center ${
                                    hasReachedTeamLimit
                                        ? "border-neutral-700 bg-neutral-800 cursor-default opacity-50"
                                        : "cursor-pointer border-indigo-500 hover:bg-neutral-800"
                                }`}
                            >
                                <p className="text-gray-300 text-lg">{t("team.create_desc")}</p>
                                <p className="text-indigo-400 font-semibold mt-4 text-2xl">+ {t("team.create_button")}</p>
                            </div>
                        </div>

                        <div className="flex justify-center mt-10">
                            <div
                                className={`flex gap-2 items-centerp-4 rounded-xl ${
                                    hasReachedTeamLimit ? "opacity-50 cursor-default" : ""
                                }`}
                            >
                                <input
                                    type="text"
                                    value={joinUrl}
                                    onChange={(e) => setJoinUrl(e.target.value)}
                                    placeholder={t("team.invite_placeholder")}
                                    className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white w-80"
                                    disabled={hasReachedTeamLimit}
                                />
                                <button
                                    onClick={handleJoinTeam}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold"
                                >
                                    {t("team.join_button")}
                                </button>
                            </div>
                        </div>

                        <div className="mt-10 text-center text-sm text-white">
                            <a
                                href="https://twitter.com/d1xen_cs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-indigo-400 transition"
                            >
                                TeamWise App Powered by <span className="font-semibold">d1xen</span>
                            </a>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
