import { Outlet } from "react-router-dom";
import TeamSidebar from "@/layouts/TeamSidebar";
/**
 * TeamLayout - Layout pour toutes les pages liées à une team
 * Architecture: TeamSidebar (gauche) + Content (droite, géré par chaque page)
 */
export default function TeamLayout() {
    return (
        <div className="h-screen flex bg-neutral-950 overflow-hidden">
            {/* Sidebar Team */}
            <TeamSidebar />
            {/* Main content - géré par chaque page */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
}
