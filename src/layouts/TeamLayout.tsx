import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Calendar,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";

import teamwiseLogo from "@/assets/teamwise-logo.png";
import { useTeam } from "@/contexts/TeamContext";
import { AgendaProvider } from "@/contexts/AgendaContext";
import Loader from "@/components/ui/Loader";

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

function TeamSidebar() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const { resetTeam } = useTeam();

    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { label: t("nav.team"), icon: Users, path: "team" },
        { label: t("nav.agenda"), icon: Calendar, path: "agenda" },
        {
            label: t("nav.management"),
            icon: Settings,
            path: "management",
        },
    ];

    const linkBase =
        "w-full flex items-center py-3 rounded-md transition font-medium text-sm";
    const hoverStyle = "hover:bg-neutral-700 hover:text-indigo-300";

    const handleChangeTeam = () => {
        resetTeam();
        navigate("/select-team", { replace: true });
    };

    return (
        <aside
            className={`fixed top-0 left-0 h-full z-40 bg-neutral-800 border-r border-neutral-700 transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            {/* Logo / collapse */}
            <div className="h-20 flex items-center justify-center relative border-b border-neutral-700">
                {!collapsed ? (
                    <>
                        <img
                            src={teamwiseLogo}
                            alt="TeamWise"
                            className="h-10 w-auto"
                        />
                        <button
                            onClick={() => setCollapsed(true)}
                            className="absolute right-4 p-2 rounded hover:bg-neutral-700"
                            title={t("sidebar.collapse")}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="w-full h-full flex items-center justify-center hover:bg-neutral-700"
                        title={t("sidebar.expand")}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 px-2 py-4 flex-1">
                {navItems.map((item) => {
                    const isActive =
                        location.pathname.endsWith(`/${item.path}`);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`${linkBase} ${
                                collapsed
                                    ? "justify-center"
                                    : "justify-start gap-3 pl-6"
                            } ${
                                isActive
                                    ? "bg-indigo-600 text-white"
                                    : hoverStyle
                            }`}
                        >
                            <item.icon className="w-6 h-6" />
                            {!collapsed && (
                                <span className="text-[15px]">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Change team */}
            <div className="px-2 py-4 border-t border-neutral-700">
                <button
                    onClick={handleChangeTeam}
                    className={`${linkBase} ${
                        collapsed
                            ? "justify-center"
                            : "justify-start gap-3 pl-6"
                    } hover:bg-neutral-700 text-red-400 hover:text-red-300`}
                >
                    <LogOut className="w-6 h-6" />
                    {!collapsed && (
                        <span className="text-[15px]">
                            {t("sidebar.changeTeam")}
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export default function TeamLayout() {
    const { isReady, isLoading } = useTeam();

    if (!isReady || isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-neutral-900">
                <Loader />
            </div>
        );
    }

    return (
        <AgendaProvider>
            <div className="flex h-screen bg-neutral-900 text-white">
                <TeamSidebar />

                <div className="flex-1 ml-64">
                    <main className="h-full overflow-y-auto p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </AgendaProvider>
    );
}
