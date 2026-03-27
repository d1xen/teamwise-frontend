import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from '@/i18n';
import Flag from "react-world-flags";
import { Users, Crosshair, BookOpen, Calendar, LayoutDashboard, Globe } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { STEAM_AUTH_URL } from "@/api/endpoints/auth.api";
import { appConfig } from "@/config/appConfig";
import TeamWiseLogo from "@/shared/components/TeamWiseLogo";
import steamLogo from "@/shared/assets/icon-steam.svg";

export default function LoginPage() {
    const { t } = useTranslation();
    const location = useLocation();
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

    const changeLanguage = (lng: "en" | "fr") => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
        setLangOpen(false);
    };

    const handleSteamLogin = () => {
        // Preserve intended destination across Steam OAuth redirect
        const from = (location.state as { from?: string } | null)?.from;
        if (from) {
            sessionStorage.setItem("tw_return_url", from);
        }
        window.location.href = STEAM_AUTH_URL;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.07),transparent)]" />

            {/* Top bar — Discord + Language */}
            <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
                <a
                    href={appConfig.externalLinks.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-[#5865F2] hover:border-[#5865F2]/30 transition-all text-sm font-medium"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    <span>Discord</span>
                </a>

                <div ref={langRef} className="relative">
                    <button
                        onClick={() => setLangOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all text-sm font-medium"
                    >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{i18n.language === "fr" ? "FR" : "EN"}</span>
                    </button>
                    {langOpen && (
                        <div className="absolute top-full right-0 mt-1.5 w-36 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl overflow-hidden">
                            {(["fr", "en"] as const).map((lng) => {
                                const active = i18n.language === lng;
                                return (
                                    <button
                                        key={lng}
                                        onClick={() => changeLanguage(lng)}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium transition-colors ${
                                            active ? "text-white bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                                        }`}
                                    >
                                        <Flag code={lng === "fr" ? "FR" : "GB"} className="w-4 h-3 rounded-none" />
                                        {lng === "fr" ? "Français" : "English"}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Title */}
                <div className="text-center mb-8">
                    <div className="mb-8">
                        <TeamWiseLogo size={64} />
                    </div>
                    <div className="h-1 w-24 rounded-full mx-auto mb-6" style={{ background: 'linear-gradient(90deg, #60A5FA, #6366F1, #A855F7)', opacity: 0.5 }} />
                    <h2 className="text-xl font-semibold text-neutral-200 mb-2">
                        {t("auth.welcome_title")}
                    </h2>
                    <p className="text-neutral-400">
                        {t("auth.platform_tagline")}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl p-8 shadow-2xl">
                    {/* Steam Login Button */}
                    <button onClick={handleSteamLogin}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#1b2838] to-[#2a475e] hover:from-[#2a475e] hover:to-[#1b2838] text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
                        <img src={steamLogo} alt="Steam" className="w-6 h-6" />
                        <span>{t("auth.login_with_steam")}</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-neutral-800" />
                        <span className="text-xs text-neutral-500 uppercase tracking-wider">
                            {t("auth.features_title")}
                        </span>
                        <div className="flex-1 h-px bg-neutral-800" />
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                        <FeatureItem icon={Users} text={t("login.feature_team")} />
                        <FeatureItem icon={Crosshair} text={t("login.feature_matches")} />
                        <FeatureItem icon={BookOpen} text={t("login.feature_stratbook")} />
                        <FeatureItem icon={Calendar} text={t("login.feature_schedule")} />
                        <FeatureItem icon={LayoutDashboard} text={t("login.feature_dashboard")} />
                    </div>

                    {/* Coming soon */}
                    <div className="mt-5 pt-4 border-t border-neutral-800/60">
                        <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">{t("login.coming_soon")}</p>
                        <p className="text-xs text-neutral-500">{t("login.coming_soon_list")}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 space-y-2">
                    <p className="text-xs text-neutral-500">
                        {t("auth.accept_terms")}{" "}
                        <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors underline">
                            {t("auth.terms_of_service")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg shrink-0">
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-sm text-neutral-300">{text}</span>
        </div>
    );
}
