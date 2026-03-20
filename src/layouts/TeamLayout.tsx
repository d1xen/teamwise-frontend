import { Outlet } from "react-router-dom";
import TeamSidebar from "@/layouts/TeamSidebar";
import { useTeam } from "@/contexts/team/useTeam";
import { useTranslation } from "react-i18next";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import { Button } from "@/design-system/components";

/**
 * TeamLayout - Layout pour toutes les pages liées à une team
 * Architecture: TeamSidebar (gauche) + Content (droite, géré par chaque page)
 */
export default function TeamLayout() {
    const { t } = useTranslation();
    const { isReady, team, refreshTeam, isLoading } = useTeam();

    if (!isReady) {
        return <FullScreenLoader />;
    }

    if (!team) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
                <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/70 p-8 text-center shadow-2xl">
                    <h1 className="text-xl font-semibold text-white">
                        {t("common.error")}
                    </h1>
                    <p className="mt-3 text-sm text-neutral-400">
                        {t("common.try_again")}
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Button
                            onClick={() => void refreshTeam()}
                            isLoading={isLoading}
                        >
                            {t("common.try_again")}
                        </Button>
                    </div>
                </div>
            </div>
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
