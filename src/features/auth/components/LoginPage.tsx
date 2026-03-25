import { useTranslation } from "react-i18next";
import i18n from '@/i18n';
import Flag from "react-world-flags";
import { Swords, Users, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { STEAM_AUTH_URL } from "@/api/endpoints/auth.api";
import TeamWiseLogo from "@/shared/components/TeamWiseLogo";
import steamLogo from "@/shared/assets/icon-steam.svg";
import AppVersion from "@/shared/components/AppVersion";

export default function LoginPage() {
    const { t } = useTranslation();
    const location = useLocation();

    const changeLanguage = (lng: "en" | "fr") => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
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

            {/* Language Selector */}
            <div className="absolute top-6 right-6 flex gap-2 z-10">
                {(["en", "fr"] as const).map((lng) => {
                    const isActive = i18n.language === lng;
                    return (
                        <button key={lng} onClick={() => changeLanguage(lng)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                isActive
                                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                                    : "border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700"
                            }`}>
                            <Flag code={lng === "fr" ? "FR" : "GB"} className="w-5 h-3 rounded-sm" />
                            <span className="text-xs font-medium">{lng === "fr" ? "FR" : "EN"}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Title */}
                <div className="text-center mb-12">
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
                        <FeatureItem icon={Swords} text={t("login.feature_matches")} />
                        <FeatureItem icon={Calendar} text={t("login.feature_schedule")} />
                        <FeatureItem icon={Users} text={t("login.feature_team")} />
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
                    <AppVersion />
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
