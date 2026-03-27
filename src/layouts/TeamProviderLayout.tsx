import { Outlet, useParams } from "react-router-dom";
import { TeamProvider } from "@/contexts/team/TeamContext.tsx";

export default function TeamProviderLayout() {
    const { teamId } = useParams<{ teamId: string }>();

    // key={teamId} forces a clean remount of TeamProvider when switching teams.
    // Without it, React reuses the same TeamProvider instance and the old team
    // data bleeds into the new team context.
    return (
        <TeamProvider key={teamId}>
            <Outlet />
        </TeamProvider>
    );
}
