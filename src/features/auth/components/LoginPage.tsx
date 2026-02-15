import { useTranslation } from "react-i18next";
import i18n from '@/i18n';
import Flag from "react-world-flags";

import steamLogo from "@/shared/assets/icon-steam.svg";
import teamwiseLogo from "@/shared/assets/teamwise-logo.png";

export default function LoginPage() {
    const { t } = useTranslation();

    const changeLanguage = (lng: "en" | "fr") => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-neutral-900 text-white px-4">
            <div className="text-center space-y-6 max-w-md">
                <img
                    src={teamwiseLogo}
                    alt="TeamWise"
                    className="mx-auto w-56 h-auto"
                />

                <p className="text-lg text-gray-400">
                    {t("login.subtitle")}
                </p>

                <div className="flex justify-center gap-4">
                    {(["en", "fr"] as const).map((lng) => {
                        const isActive = i18n.language === lng;
                        return (
                            <button
                                key={lng}
                                onClick={() => changeLanguage(lng)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition ${
                                    isActive
                                        ? "border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/30"
                                        : "border-neutral-700 hover:bg-neutral-800"
                                }`}
                            >
                                <Flag
                                    code={lng === "fr" ? "FR" : "GB"}
                                    className="w-6 h-4 rounded-sm"
                                />
                                <span className="text-sm">
                                    {lng === "fr" ? "Français" : "English"}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <a
                    href="/api/auth/steam"
                    className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-medium py-3 px-6 rounded-xl shadow transition"
                >
                    <img src={steamLogo} alt="Steam" className="w-6 h-6" />
                    {t("login.cta")}
                </a>
            </div>
        </div>
    );
}
