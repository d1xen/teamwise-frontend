import { useTranslation } from "react-i18next";
import i18n from "../../locales/i18n";
import steamLogo from "../../assets/icon-steam.svg";
import teamwiseLogo from "../../assets/TeamWiseLogo.png";
import Flag from "react-world-flags";

export default function LandingPage() {
    const { t } = useTranslation();

    const changeLanguage = (lng: 'en' | 'fr') => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-neutral-900 text-white px-4">
            <div className="text-center space-y-6 max-w-md -mt-40">
                <div className="relative inline-block overflow-hidden" style={{lineHeight: 0}}>
                    <img
                        src={teamwiseLogo}
                        alt="TeamWise Logo"
                        className="mx-auto w-60 h-auto"
                    />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">TeamWise</h1>

                <p className="text-lg text-gray-400">
                    {t("landing.subtitle", "Managez votre équipe")}{" "}
                    <span className="text-white font-semibold">E-Sport</span>{" "}
                    {t("landing.like_never", "comme jamais.")}
                </p>

                <div className="flex justify-center gap-4 mt-4">
                    {["en", "fr"].map((lng) => {
                        const isActive = i18n.language === lng;
                        return (
                            <button
                                key={lng}
                                onClick={() => changeLanguage(lng as "en" | "fr")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition border
                    ${isActive
                                    ? "border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/30 bg-neutral-900"
                                    : "border-neutral-700 text-white hover:bg-neutral-800"
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
                    href="http://localhost:8080/api/auth/steam"
                    className="inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-medium py-3 px-6 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                >
                    <img src={steamLogo} alt="Steam" className="w-6 h-6"/>
                    {t("landing.login", "Se connecter")}
                </a>
            </div>
        </div>
    );
}
