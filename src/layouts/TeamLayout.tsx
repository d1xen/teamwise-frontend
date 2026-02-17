import { Outlet } from "react-router-dom";
import TeamSidebar from "@/layouts/TeamSidebar";
import { useTeam } from "@/contexts/team/useTeam";
import { useTranslation } from "react-i18next";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import { useMinimumLoader } from "@/shared/hooks/useMinimumLoader";

/**
 * TeamLayout - Layout pour toutes les pages liées à une team
 * Architecture: TeamSidebar (gauche) + Content (droite, géré par chaque page)
 */
export default function TeamLayout() {
    const { t } = useTranslation();
    const { isReady } = useTeam();
    const showLoader = useMinimumLoader(!isReady, 800);

    if (showLoader) {
        return (
            <FullScreenLoader
                title={t("common.loading")}
                subtitle={t("team.loading_context")}
            />
        );
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
