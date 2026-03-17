import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { getMyTeams } from "@/api/endpoints/team.api";
import type { TeamDto } from "@/api/types/team";
import { Users, Plus, ChevronRight, Shield, LogOut, Heart, LogIn } from "lucide-react";
import { appConfig } from '@/config/appConfig';
import { useMinimumLoader } from '@/shared/hooks/useMinimumLoader';
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import JoinTeamModal from "@/features/team/components/JoinTeamModal";

type Team = {
    id: number;
    name: string;
    tag: string;
    logoUrl?: string;
};

export default function SelectTeamPage() {
    const { t } = useTranslation();
    const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
    const navigate = useNavigate();
    const kofiUrl = appConfig.externalLinks.kofi;

    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const showLoader = useMinimumLoader(isAuthLoading || isLoading, 800);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthLoading, isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthLoading || !isAuthenticated) return;

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
                            ...(team.logoUrl && { logoUrl: team.logoUrl }),
                        }))
                    );
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t("team.load_error"));
                    setTeams([]);
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => { cancelled = true; };
    }, [isAuthLoading, isAuthenticated, t]);

    if (showLoader) {
        return (
            <FullScreenLoader
                title={t("common.loading")}
                subtitle={t("team.loading_teams")}
            />
        );
    }

    const handleTeamClick = (teamId: number) => {
        if (!user) return;
        navigate(`/team/${teamId}`);
    };

    const handleLogout = () => {
        if (window.confirm(t("auth.logout_confirm"))) {
            logout();
            navigate("/login");
        }
    };

    const handleJoinSuccess = async () => {
        // Rafraîchir la liste des équipes
        setIsLoading(true);
        try {
            const teamsData = await getMyTeams();
            setTeams(
                teamsData.map((team) => ({
                    id: team.id,
                    name: team.name,
                    tag: team.tag ?? "",
                    ...(team.logoUrl && { logoUrl: team.logoUrl }),
                }))
            );
            setError(null);
        } catch {
            setError(t("team.load_error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-8">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Top Right Buttons */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                {/* Soutenir TeamWise Button */}
                <a
                    href={kofiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-500/20 transition-all duration-200"
                >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">{t("donate.cta")}</span>
                </a>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-200"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">{t("auth.logout")}</span>
                </button>
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                <div className="text-center mb-12">
                    <style>{`
                        @keyframes fadeColor {
                            0%, 100% { opacity: 0.75; }
                            50% { opacity: 1; }
                        }
                        .animate-fade-color {
                            animation: fadeColor 4s ease-in-out infinite;
                        }
                        @keyframes waveGradient {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                        .animate-wave-gradient {
                            background-size: 200% 200%;
                            animation: waveGradient 4s ease-in-out infinite;
                        }
                    `}</style>
                    <div className="mb-8">
                        <h1 className="text-6xl font-black text-white mb-4 leading-tight">
                            TEAM
                            <span className="animate-fade-color animate-wave-gradient inline-block text-transparent bg-clip-text bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-400">
                                WISE
                            </span>
                        </h1>
                    </div>
                    <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-6" />
                    <h2 className="text-xl font-semibold text-neutral-200 mb-2">{t("team.select_title")}</h2>
                    <p className="text-neutral-400">{t("team.welcome", { nickname: user?.nickname })}</p>
                </div>

                <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {teams.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="p-4 bg-neutral-800/50 rounded-full w-fit mx-auto mb-4">
                                <Users className="w-12 h-12 text-neutral-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t("team.no_teams_title")}</h3>
                            <p className="text-neutral-400 mb-6">{t("team.no_teams_message")}</p>
                            <button onClick={() => navigate("/team/create")} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02]">
                                <Plus className="w-5 h-5" />
                                {t("team.create_team")}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {teams.map((team) => (
                                    <button key={team.id} onClick={() => handleTeamClick(team.id)} className="w-full group">
                                        <div className="flex items-center gap-4 p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl hover:border-indigo-500/50 hover:bg-neutral-800 transition-all duration-200">
                                            {team.logoUrl ? (
                                                <img src={team.logoUrl} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-neutral-700 flex items-center justify-center">
                                                    <Shield className="w-6 h-6 text-neutral-500" />
                                                </div>
                                            )}
                                            <div className="flex-1 text-left">
                                                <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{team.name}</h3>
                                                <p className="text-sm text-neutral-500">[{team.tag}]</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Créer une équipe */}
                                <button
                                    onClick={() => navigate("/team/create")}
                                    className="group flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 transition-all duration-200"
                                >
                                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold text-sm text-center">{t("team.create_new_team")}</span>
                                </button>

                                {/* Rejoindre une équipe */}
                                <button
                                    onClick={() => setIsJoinModalOpen(true)}
                                    className="group flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-cyan-500/30 hover:border-cyan-500/60 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 hover:text-cyan-200 transition-all duration-200"
                                >
                                    <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    <span className="font-semibold text-sm text-center">{t("team.join.title")}</span>
                                </button>
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-neutral-500 mt-6">
                    <Link
                        to="/terms-auth"
                        className="text-neutral-400 hover:text-indigo-400 transition-colors underline"
                    >
                        {t("auth.terms_of_service")}
                    </Link>
                </p>
            </div>

            {/* Join Team Modal */}
            <JoinTeamModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onSuccess={handleJoinSuccess}
            />
        </div>
    );
}
