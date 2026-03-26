import { Outlet } from "react-router-dom";
import TeamSidebar from "@/layouts/TeamSidebar";
import { useTeam } from "@/contexts/team/useTeam";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import ErrorPage from "@/shared/components/ErrorPage";

/**
 * TeamLayout - Layout pour toutes les pages liées à une team
 * Architecture: TeamSidebar (gauche) + Content (droite, géré par chaque page)
 */
export default function TeamLayout() {
    const { isReady, team, loadError } = useTeam();

    if (!isReady) {
        return <FullScreenLoader />;
    }

    if (!team) {
        const status = loadError?.status;
        const variant = status === 403 ? "403" : status === 404 ? "404" : "500";
        return <ErrorPage variant={variant} />;
    }

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
