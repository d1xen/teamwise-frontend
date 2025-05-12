import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../locales/i18n";
import teamwiseLogo from "../../assets/TeamWiseLogo.png";
import Flag from "react-world-flags";

interface AppHeaderProps {
    user: {
        avatarUrl: string;
        nickname: string;
        customUsername?: string;
    };
    onLogout: () => void;
    small?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user, onLogout }) => {
    const { teamId } = useParams();
    const [teamName, setTeamName] = useState<string | null>(null);
    const [teamLogo, setTeamLogo] = useState<string | null>(null);
    const { t: translate } = useTranslation();
    const [lang, setLang] = useState(i18n.language);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!teamId) {
            setTeamName(null);
            setTeamLogo(null);
            return;
        }

        fetch(`/api/teams/${teamId}`)
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (data?.name) {
                    setTeamName(data.name);
                    setTeamLogo(data.logoUrl ? `http://localhost:8080${data.logoUrl}` : null); // ⬅️ Ajout
                }
            })
            .catch(() => {
                setTeamName(null);
                setTeamLogo(null);
            });
    }, [teamId]);


    const toggleLanguageMenu = () => {
        setIsLangMenuOpen((prev) => !prev);
    };

    const changeLanguage = (lng: "en" | "fr") => {
        i18n.changeLanguage(lng);
        setLang(lng);
        setIsLangMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="w-full h-20 px-6 flex justify-between items-center bg-neutral-900 border-b border-neutral-700">
            <div className="flex-1" />

            <div className="flex-1 flex justify-center items-center">
                {teamName ? (
                    <div className="flex items-center gap-3">
                        {teamLogo && (
                            <img
                                src={teamLogo}
                                alt={`${teamName} logo`}
                                className="h-8 w-auto object-contain"
                            />
                        )}
                        <h1 className="font-bold tracking-tight text-white text-2xl">{teamName}</h1>
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
                <div className="flex items-center gap-3 cursor-pointer px-3 py-1.5 rounded-md hover:bg-neutral-800 transition">
                    <img
                        src={user.avatarUrl}
                        alt={user.nickname}
                        className="w-9 h-9 rounded-full"
                    />
                    <span className="text-white text-[15px] font-medium">
                        {user.customUsername || user.nickname}
                    </span>
                </div>

                <button
                    onClick={onLogout}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-md transition"
                >
                    {translate("header.logout")}
                </button>

                {/* Language switch */}
                <div className="relative" ref={langMenuRef}>
                    <button
                        onClick={toggleLanguageMenu}
                        className="px-2 py-1 rounded-md hover:bg-neutral-800 transition text-sm text-white border border-neutral-700 flex items-center gap-2"
                        title={translate("header.language")}
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
                                {translate("header.english")}
                            </button>
                            <button
                                onClick={() => changeLanguage("fr")}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-neutral-700 w-full text-left"
                            >
                                <Flag code="FR" className="w-5 h-3.5 rounded-sm" />
                                {translate("header.french")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
