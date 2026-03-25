import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/auth/useAuth";
import { getMyTeams } from "@/api/endpoints/team.api";
import type { TeamDto } from "@/api/types/team";
import { Plus, LogIn, LogOut, ChevronRight, Users, Heart, Lock } from "lucide-react";
import { appConfig } from "@/config/appConfig";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import ConfirmModal from "@/shared/components/ConfirmModal";
import AppVersion from "@/shared/components/AppVersion";
import JoinTeamModal from "@/features/team/components/JoinTeamModal";
import TeamWiseLogo from "@/shared/components/TeamWiseLogo";
import { MAX_TEAMS_PER_USER } from "@/shared/constants/teamConstants";
import { TeamAvatar } from "@/shared/components/TeamAvatar";
import { UserAvatar } from "@/shared/components/UserAvatar";

type Team = {
    id: number;
    name: string;
    tag: string;
    game?: string;
    logoUrl?: string;
};

export default function SelectTeamPage() {
    const { t } = useTranslation();
    const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const kofiUrl = appConfig.externalLinks.kofi;

    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthLoading, isAuthenticated, navigate]);

    // Handle FACEIT OAuth2 return
    useEffect(() => {
        const faceit = searchParams.get("faceit");
        if (!faceit) return;

        if (faceit === "linked") {
            toast.success(t("faceit.connect_success"));
        } else if (faceit === "error") {
            const reason = searchParams.get("reason") ?? "";
            const key = `faceit.connect_error_${reason}`;
            toast.error(t(key, { defaultValue: t("faceit.connect_error") }));
        }

        // Clean URL
        setSearchParams(prev => {
            prev.delete("faceit");
            prev.delete("reason");
            return prev;
        }, { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isAuthLoading || !isAuthenticated) return;

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        getMyTeams()
            .then((data: TeamDto[]) => {
                if (!cancelled) {
                    setTeams(
                        data.map((team) => ({
                            id: team.id,
                            name: team.name,
                            tag: team.tag ?? "",
                            ...(team.game ? { game: team.game } : {}),
                            ...(team.logoUrl ? { logoUrl: team.logoUrl } : {}),
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

    if (isAuthLoading || isLoading) {
        return <FullScreenLoader />;
    }

    const handleTeamClick = (teamId: number) => {
        if (!user) return;
        navigate(`/team/${teamId}`);
    };

    const handleLogout = () => setShowLogoutConfirm(true);
    const confirmLogout = () => { logout(); navigate("/login"); };

    const atTeamLimit = teams.length >= MAX_TEAMS_PER_USER;

    const handleJoinSuccess = async () => {
        setIsLoading(true);
        try {
            const data = await getMyTeams();
            setTeams(data.map((team) => ({
                id: team.id,
                name: team.name,
                tag: team.tag ?? "",
                ...(team.game ? { game: team.game } : {}),
                ...(team.logoUrl ? { logoUrl: team.logoUrl } : {}),
            })));
            setError(null);
        } catch {
            setError(t("team.load_error"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-neutral-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-8 py-5">
                <TeamWiseLogo size={26} />

                <div className="flex items-center gap-3">
                    <a
                        href={kofiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-sm font-medium"
                    >
                        <Heart className="w-3.5 h-3.5" />
                        <span>{t("donate.label")}</span>
                    </a>

                    <div className="w-px h-4 bg-neutral-800" />

                    <div className="flex items-center gap-2">
                        {user && (
                            <UserAvatar
                                profileImageUrl={user.profileImageUrl}
                                avatarUrl={user.avatarUrl}
                                nickname={user.nickname}
                                size={32}
                                className="border border-neutral-700"
                            />
                        )}
                        <span className="text-sm text-neutral-300 font-medium">{user?.nickname}</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={t("auth.logout")}
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
                <div className="w-full max-w-md">

                    {/* Heading */}
                    <div className="mb-10">
                        <div className="h-px w-8 mb-6" style={{ background: 'linear-gradient(90deg, #60A5FA, #6366F1, #A855F7)' }} />
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            {t("team.select_title")}
                        </h1>
                        <p className="text-neutral-500 text-sm">
                            {t("team.welcome", { nickname: user?.nickname })}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {teams.length === 0 ? (
                        /* Empty state */
                        <div className="py-16 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5">
                                <Users className="w-7 h-7 text-neutral-600" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">{t("team.no_teams_title")}</h3>
                            <p className="text-sm text-neutral-500 mb-8">{t("team.no_teams_message")}</p>
                            <button
                                onClick={() => navigate("/team/create")}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#4338ca] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {t("team.create_team")}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Team list */}
                            <div className="space-y-2 mb-6">
                                {teams.map((team) => (
                                    <TeamCard
                                        key={team.id}
                                        team={team}
                                        onClick={() => handleTeamClick(team.id)}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            {atTeamLimit ? (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
                                    <Lock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                                    <p className="text-xs text-neutral-600">
                                        {t("team.max_teams_reached", { max: MAX_TEAMS_PER_USER })}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate("/team/create")}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t("team.create_new_team")}
                                    </button>
                                    <button
                                        onClick={() => setIsJoinModalOpen(true)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        {t("team.join.title")}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-10 space-y-2">
                        <p className="text-xs text-neutral-600">
                            <Link to="/terms" className="hover:text-neutral-400 transition-colors">
                                {t("auth.terms_of_service")}
                            </Link>
                        </p>
                        <AppVersion />
                    </div>
                </div>
            </div>

            <JoinTeamModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onSuccess={handleJoinSuccess}
            />

            {showLogoutConfirm && (
                <ConfirmModal
                    title={t("auth.logout_title")}
                    description={t("auth.logout_confirm")}
                    confirmLabel={t("auth.logout")}
                    cancelLabel={t("common.cancel")}
                    variant="warning"
                    onConfirm={async () => confirmLogout()}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            )}
        </div>
    );
}

function TeamCard({ team, onClick }: { team: Team; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full group text-left">
            <div className="relative flex items-center gap-4 px-5 py-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm hover:border-neutral-700 hover:bg-neutral-800/60 transition-all duration-150 overflow-hidden">
                {/* Left accent */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ background: 'linear-gradient(to bottom, #60A5FA, #6366F1, #A855F7)' }}
                />

                {/* Logo */}
                <TeamAvatar
                    logoUrl={team.logoUrl}
                    name={team.name}
                    tag={team.tag}
                    size={56}
                    className="border border-neutral-700/50"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-white truncate">{team.name}</span>
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-500 font-mono font-bold">
                            {team.tag}
                        </span>
                    </div>
                    {team.game && (
                        <span className="text-xs text-neutral-600 font-medium">{team.game}</span>
                    )}
                </div>

                {/* Arrow */}
                <ChevronRight className="flex-shrink-0 w-4 h-4 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all duration-150" />
            </div>
        </button>
    );
}
