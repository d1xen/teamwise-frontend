import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { useAuth } from "../../context/AuthContext";
import teamwiseLogo from "../../assets/TeamWiseLogo.png";
import {
    LayoutDashboard,
    BookOpen,
    BarChart2,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut
} from "lucide-react";

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    if (!user) return null;

    const navItems = [
        { label: "Planning", icon: LayoutDashboard, path: "planning" },
        { label: "Stratbook", icon: BookOpen, path: "stratbook" },
        { label: "Management", icon: Settings, path: "management" },
        { label: "Stats", icon: BarChart2, path: "stats" }
    ];

    const linkBase =
        "w-full flex items-center py-3 rounded-md transition font-medium text-sm";

    const hoverStyle = "hover:bg-neutral-700 hover:text-indigo-300 group";

    return (
        <div className="flex h-screen bg-neutral-900 text-white overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`transition-all duration-300 bg-neutral-800 border-r border-neutral-700 flex flex-col fixed top-0 left-0 h-full z-40 ${
                    collapsed ? "w-20" : "w-64"
                }`}
            >
                <div className="w-full h-20 px-4 border-b border-neutral-700 relative flex items-center justify-center">
                    {!collapsed ? (
                        <>
                            <img
                                src={teamwiseLogo}
                                alt="TeamWise Logo"
                                className="h-12 w-auto object-contain"
                            />
                            <button
                                onClick={() => setCollapsed(true)}
                                className="absolute right-4 w-8 h-8 flex items-center justify-center text-white rounded hover:bg-neutral-700"
                                title="Réduire"
                            >
                                <ChevronLeft className="w-5 h-5"/>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setCollapsed(false)}
                                className="relative flex items-center justify-center w-full h-20 group"
                                title="Ouvrir la barre latérale"
                            >
                                <img
                                    src={teamwiseLogo}
                                    alt="TeamWise Logo"
                                    className="h-10 w-auto object-contain pointer-events-none"
                                />
                                <div
                                    className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-6 h-8 flex items-center justify-center
                                       bg-neutral-800 text-white border border-neutral-700 rounded-r-full shadow-sm transition
                                       group-hover:bg-neutral-700"
                                >
                                    <ChevronRight className="w-4 h-4 pointer-events-none"/>
                                </div>
                            </button>
                        </>
                    )}
                </div>

                {/* Nav items */}
                <nav className="flex flex-col items-center gap-2 px-2 py-4 flex-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname.includes(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                title={collapsed ? item.label : ""}
                                className={`${linkBase} ${
                                    collapsed ? "justify-center" : "justify-start gap-3 pl-6"
                                } ${isActive ? "bg-indigo-600 text-white" : hoverStyle}`}
                            >
                                <item.icon className="w-6 h-6"/>
                                {!collapsed && (
                                    <span className="text-[15px]">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Changer d'équipe */}
                <div className="px-2 pb-4 mt-auto">
                    <button
                        onClick={() => {
                            localStorage.removeItem("teamId");
                            navigate("/home");
                        }}
                        className={`${linkBase} ${
                            collapsed ? "justify-center" : "justify-start gap-3 pl-6"
                        } hover:bg-red-500/10 hover:text-red-300`}
                    >
                        <LogOut className="w-6 h-6"/>
                        {!collapsed && (
                            <span className="text-[15px]">Changer d'équipe</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`flex-1 flex flex-col ${collapsed ? "ml-20" : "ml-64"}`}>
                <div className="fixed top-0 left-0 right-0 z-30">
                    <AppHeader user={user} onLogout={logout} small/>
                </div>
                <main className="flex-1 overflow-y-auto pt-14 p-6">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}
