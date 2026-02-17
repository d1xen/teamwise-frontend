import { useTranslation } from "react-i18next";
import i18n from '@/i18n';
import Flag from "react-world-flags";
import { Shield, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { STEAM_AUTH_URL } from "@/api/endpoints/auth.api";

import steamLogo from "@/shared/assets/icon-steam.svg";

export default function LoginPage() {
    const { t } = useTranslation();

    const changeLanguage = (lng: "en" | "fr") => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
    };

    const handleSteamLogin = () => {
        window.location.href = STEAM_AUTH_URL;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Language Selector - Top Right */}
            <div className="absolute top-6 right-6 flex gap-2 z-10">
                {(["en", "fr"] as const).map((lng) => {
                    const isActive = i18n.language === lng;
                    return (
                        <button
                            key={lng}
                            onClick={() => changeLanguage(lng)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
                                isActive
                                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                                    : "border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-white hover:border-neutral-700"
                            }`}
                        >
                            <Flag
                                code={lng === "fr" ? "FR" : "GB"}
                                className="w-5 h-3 rounded-sm"
                            />
                            <span className="text-xs font-medium">
                                {lng === "fr" ? "FR" : "EN"}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md px-6">
                {/* Animated Title */}
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
                    <button
                        onClick={handleSteamLogin}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#1b2838] to-[#2a475e] hover:from-[#2a475e] hover:to-[#1b2838] text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                    >
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
                    <div className="space-y-3">
                        <FeatureItem
                            icon={Users}
                            text={t("auth.feature_manage_team")}
                        />
                        <FeatureItem
                            icon={Shield}
                            text={t("auth.feature_secure")}
                        />
                        <FeatureItem
                            icon={Zap}
                            text={t("auth.feature_modern")}
                        />
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-neutral-500 mt-6">
                    {t("auth.accept_terms")}{" "}
                    <Link
                        to="/terms"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors underline"
                    >
                        {t("auth.terms_of_service")}
                    </Link>
                </p>
            </div>
        </div>
    );
}

// Feature Item Component
function FeatureItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-neutral-300">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Icon className="w-4 h-4 text-indigo-400" />
            </div>
            <span>{text}</span>
        </div>
    );
}
