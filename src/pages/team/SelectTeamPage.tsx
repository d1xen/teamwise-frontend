import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";
import { toast } from "react-hot-toast";
import { Plus, LogIn, LogOut, ChevronRight, Users, Heart, Lock, Globe } from "lucide-react";
import { useAuth } from "@/contexts/auth/useAuth";
import { getMyTeams } from "@/api/endpoints/team.api";
import type { TeamDto } from "@/api/types/team";
import { appConfig } from "@/config/appConfig";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import ConfirmModal from "@/shared/components/ConfirmModal";
import AppVersion from "@/shared/components/AppVersion";
import JoinTeamModal from "@/features/team/components/JoinTeamModal";
import TeamWiseLogo from "@/shared/components/TeamWiseLogo";
import { MAX_TEAMS_PER_USER } from "@/shared/constants/teamConstants";
import { TeamAvatar } from "@/shared/components/TeamAvatar";
import { UserAvatar } from "@/shared/components/UserAvatar";

type Team = { id: number; name: string; tag: string; game?: string | undefined; logoUrl?: string | undefined };

export default function SelectTeamPage() {
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [teams, setTeams] = useState<Team[]>([]);
    const [pageReady, setPageReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!langOpen) return;
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [langOpen]);

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthLoading, isAuthenticated, navigate]);

    // ── FACEIT OAuth return (one-shot) ──────────────────────────────────────
    useEffect(() => {
        const faceit = searchParams.get("faceit");
        if (!faceit) return;
        if (faceit === "linked") toast.success(t("faceit.connect_success"));
        else if (faceit === "error") {
            const reason = searchParams.get("reason") ?? "";
            toast.error(t(`faceit.connect_error_${reason}`, { defaultValue: t("faceit.connect_error") }));
        }
        setSearchParams(prev => { prev.delete("faceit"); prev.delete("reason"); return prev; }, { replace: true });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load teams (once) ───────────────────────────────────────────────────
    const loadTeams = useCallback(async () => {
        try {
            const data = await getMyTeams();
            setTeams(data.map((d: TeamDto) => ({
                id: d.id, name: d.name, tag: d.tag ?? "",
                ...(d.game ? { game: d.game } : {}),
                ...(d.logoUrl ? { logoUrl: d.logoUrl } : {}),
            })));
            setError(null);
        } catch {
            setError(t("team.load_error"));
            setTeams([]);
        } finally {
            setPageReady(true);
        }
    }, [t]);

    useEffect(() => {
        if (!isAuthLoading && isAuthenticated) loadTeams();
    }, [isAuthLoading, isAuthenticated, loadTeams]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleTeamClick = (teamId: number) => {
        navigate(`/team/${teamId}/dashboard`);
    };

    const handleLogout = () => setShowLogoutConfirm(true);
    const confirmLogout = () => { logout(); navigate("/login"); };

    const handleJoinSuccess = () => loadTeams();

    // ── Loading state ───────────────────────────────────────────────────────
    if (!pageReady) return <FullScreenLoader />;

    const atTeamLimit = teams.length >= MAX_TEAMS_PER_USER;

    return (
        <div className="min-h-screen flex flex-col bg-neutral-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

            {/* Top bar — z-20 so dropdown renders above main content z-10 */}
            <div className="relative z-20 flex items-center justify-between px-8 py-5">
                <TeamWiseLogo size={36} />

                <div className="flex items-center gap-3">
                    <a href={appConfig.externalLinks.discord} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-[#5865F2] hover:border-[#5865F2]/30 transition-all text-sm font-medium">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                        <span>Discord</span>
                    </a>

                    <a href={appConfig.externalLinks.kofi} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-sm font-medium">
                        <Heart className="w-3.5 h-3.5" />
                        <span>{t("donate.label")}</span>
                    </a>

                    {/* Language */}
                    <div ref={langRef} className="relative">
                        <button onClick={() => setLangOpen(o => !o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-sm font-medium">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{i18n.language === "fr" ? "FR" : "EN"}</span>
                        </button>
                        {langOpen && (
                            <div className="absolute top-full right-0 mt-1.5 w-36 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl overflow-hidden">
                                {(["fr", "en"] as const).map(lng => (
                                    <button key={lng}
                                        onClick={() => { i18n.changeLanguage(lng); localStorage.setItem("language", lng); setLangOpen(false); }}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors ${
                                            i18n.language === lng ? "text-white bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                                        }`}>
                                        <Flag code={lng === "fr" ? "FR" : "GB"} className="w-4 h-3 rounded-none" />
                                        {lng === "fr" ? "Français" : "English"}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-px h-4 bg-neutral-800" />

                    <div className="flex items-center gap-2">
                        {user && (
                            <UserAvatar profileImageUrl={user.profileImageUrl} avatarUrl={user.avatarUrl}
                                nickname={user.nickname} size={32} className="border border-neutral-700" />
                        )}
                        <span className="text-sm text-neutral-300 font-medium">{user?.nickname}</span>
                    </div>

                    <button onClick={handleLogout} className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title={t("auth.logout")}>
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <div className="h-px w-8 mb-6" style={{ background: "linear-gradient(90deg, #60A5FA, #6366F1, #A855F7)" }} />
                        <h1 className="text-3xl font-bold text-white tracking-tight">{t("team.select_title")}</h1>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                    )}

                    {teams.length === 0 ? (
                        <div className="py-16 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5">
                                <Users className="w-7 h-7 text-neutral-600" />
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">{t("team.no_teams_title")}</h3>
                            <p className="text-sm text-neutral-500 mb-8">{t("team.no_teams_message")}</p>
                            <button onClick={() => navigate("/team/create")}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#4338ca] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-semibold transition-colors">
                                <Plus className="w-4 h-4" /> {t("team.create_team")}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-6">
                                {teams.map(team => (
                                    <TeamCard key={team.id} team={team} onClick={() => handleTeamClick(team.id)} />
                                ))}
                            </div>

                            {atTeamLimit ? (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
                                    <Lock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                                    <p className="text-xs text-neutral-600">{t("team.max_teams_reached", { max: MAX_TEAMS_PER_USER })}</p>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => navigate("/team/create")}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium">
                                        <Plus className="w-4 h-4" /> {t("team.create_new_team")}
                                    </button>
                                    <button onClick={() => setIsJoinModalOpen(true)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium">
                                        <LogIn className="w-4 h-4" /> {t("team.join.title")}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <div className="text-center mt-10 space-y-2">
                        <p className="text-xs text-neutral-600">
                            <Link to="/terms" className="hover:text-neutral-400 transition-colors">{t("auth.terms_of_service")}</Link>
                        </p>
                        <AppVersion />
                    </div>
                </div>
            </div>

            <JoinTeamModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onSuccess={handleJoinSuccess} />

            {showLogoutConfirm && (
                <ConfirmModal title={t("auth.logout_title")} description={t("auth.logout_confirm")}
                    confirmLabel={t("auth.logout")} cancelLabel={t("common.cancel")} variant="warning"
                    onConfirm={async () => confirmLogout()} onCancel={() => setShowLogoutConfirm(false)} />
            )}
        </div>
    );
}

function TeamCard({ team, onClick }: { team: Team; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full group text-left">
            <div className="relative flex items-center gap-4 px-5 py-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm hover:border-neutral-700 hover:bg-neutral-800/60 transition-all duration-150 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ background: "linear-gradient(to bottom, #60A5FA, #6366F1, #A855F7)" }} />
                <TeamAvatar logoUrl={team.logoUrl} name={team.name} tag={team.tag} size={56} className="border border-neutral-700/50" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-bold text-white truncate">{team.name}</span>
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-500 font-mono font-bold">{team.tag}</span>
                    </div>
                    {team.game && <span className="text-xs text-neutral-600 font-medium">{team.game}</span>}
                </div>
                <ChevronRight className="flex-shrink-0 w-4 h-4 text-neutral-700 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all duration-150" />
            </div>
        </button>
    );
}
