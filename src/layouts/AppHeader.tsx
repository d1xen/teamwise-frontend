import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Flag from "react-world-flags";

import i18n from "@/i18n";
import teamwiseLogo from "@/shared/assets/teamwise-logo.png";

import { useAuth } from "@/contexts/auth/useAuth.ts";
import { useOptionalTeam } from "@/contexts/team/useOptionalTeam.ts";

export function AppHeader() {
    const { user, logout, isAuthenticated } = useAuth();
    const { team } = useOptionalTeam();
    const navigate = useNavigate();

    const { t } = useTranslation();
    const [lang, setLang] = useState(i18n.language);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                langMenuRef.current &&
                !langMenuRef.current.contains(event.target as Node)
            ) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleLanguageMenu = () => {
        setIsLangMenuOpen((prev) => !prev);
    };

    const changeLanguage = (lng: "en" | "fr") => {
        i18n.changeLanguage(lng);
        localStorage.setItem("language", lng);
        setLang(lng);
        setIsLangMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    // 🔐 JWT rule: header only shown if authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <header className="w-full h-20 px-6 flex justify-between items-center bg-neutral-900 border-b border-neutral-700">
            <div className="flex-1" />

            <div className="flex-1 flex justify-center items-center">
                {team ? (
                    <div className="flex items-center gap-3">
                        {team.logoUrl && (
                            <img
                                src={team.logoUrl}
                                alt={`${team.name} logo`}
                                className="h-8 w-auto object-contain"
                            />
                        )}
                        <h1 className="font-bold tracking-tight text-white text-2xl">
                            {team.name}
                        </h1>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <img
                            src={teamwiseLogo}
                            alt="TeamWise Logo"
                            className="h-8 object-contain -mt-1"
                        />
                        <span className="text-white text-[28px] font-semibold tracking-tight leading-none">
                            TeamWise
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex justify-end items-center gap-3">
                {user && (
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-neutral-800 transition">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.nickname}
                                className="w-9 h-9 rounded-full"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-neutral-700" />
                        )}
                        <span className="text-white text-[15px] font-medium">
                            {user.nickname}
                        </span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-md transition"
                >
                    {t("header.logout")}
                </button>

                <div className="relative" ref={langMenuRef}>
                    <button
                        onClick={toggleLanguageMenu}
                        className="px-2 py-1 rounded-md hover:bg-neutral-800 transition text-sm text-white border border-neutral-700 flex items-center gap-2"
                        title={t("header.language")}
                    >
                        <Flag
                            code={lang === "fr" ? "FR" : "GB"}
                            className="w-5 h-3.5 rounded-sm"
                        />
                    </button>

                    {isLangMenuOpen && (
                        <div className="absolute right-0 mt-2 bg-neutral-800 border border-neutral-700 rounded-md shadow-md z-50 min-w-[140px]">
                            <button
                                onClick={() => changeLanguage("en")}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-neutral-700 w-full text-left"
                            >
                                <Flag code="GB" className="w-5 h-3.5 rounded-sm" />
                                {t("header.english")}
                            </button>
                            <button
                                onClick={() => changeLanguage("fr")}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-neutral-700 w-full text-left"
                            >
                                <Flag code="FR" className="w-5 h-3.5 rounded-sm" />
                                {t("header.french")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
