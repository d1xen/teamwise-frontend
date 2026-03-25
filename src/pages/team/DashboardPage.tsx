import { useTranslation } from "react-i18next";
import { useTeam } from "@/contexts/team/useTeam";
import FeatureHeader from "@/shared/components/FeatureHeader";
import TeamOverviewPanel from "@/features/team/components/management/panels/TeamOverviewPanel";

export default function DashboardPage() {
    const { t } = useTranslation();
    const { team, membership, members } = useTeam();

    if (!team || !membership) return null;

    const staffCount = members.filter(m => m.role !== "PLAYER").length;
    const playerCount = members.filter(m => m.role === "PLAYER").length;

    const handleNavigateToFaceit = () => {
        window.location.href = `/team/${team.id}/management?tab=faceit`;
    };

    return (
        <div className="flex flex-col h-full">
            <FeatureHeader
                title={t("pages.dashboard.title")}
                subtitle={t("pages.dashboard.subtitle")}
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar scrollbar-gutter-stable">
                <div className="max-w-5xl mx-auto px-8 py-6">
                    <TeamOverviewPanel
                        team={team}
                        membership={membership!}
                        members={members}
                        staffCount={staffCount}
                        playerCount={playerCount}
                        onNavigateToFaceit={handleNavigateToFaceit}
                    />
                </div>
            </div>
        </div>
    );
}
