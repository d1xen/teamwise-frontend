import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { getMyTeams } from "@/api/endpoints/team.api";
import type { TeamDto } from "@/api/types/team";
import { Users, Plus, ChevronRight, Shield, LogOut } from "lucide-react";
import teamwiseLogo from "@/shared/assets/teamwise-logo.png";

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

    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    }, [isAuthLoading, isAuthenticated]);

    if (isAuthLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    <p className="text-neutral-400">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    const handleTeamClick = (teamId: number) => {
        if (!user) return;
        if (!user.profileCompleted) {
            navigate("/complete-profile", { state: { fromTeamId: teamId } });
        } else {
            navigate(`/team/${teamId}`);
        }
    };

    const handleLogout = () => {
        if (window.confirm(t("auth.logout_confirm"))) {
            logout();
            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-8">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <button onClick={handleLogout} className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-200 z-10">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">{t("auth.logout")}</span>
            </button>

            <div className="relative z-10 w-full max-w-2xl">
                <div className="text-center mb-12">
                    <img src={teamwiseLogo} alt="TeamWise" className="mx-auto w-32 h-auto mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-2">{t("team.select_title")}</h1>
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

                            <button onClick={() => navigate("/team/create")} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-700 hover:border-indigo-500/50 rounded-xl text-neutral-400 hover:text-indigo-400 transition-all duration-200">
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">{t("team.create_new_team")}</span>
                            </button>
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
        </div>
    );
}


