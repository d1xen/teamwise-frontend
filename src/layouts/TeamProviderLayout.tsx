// src/layouts/TeamProviderLayout.tsx

import { Outlet, Navigate, useLocation, useParams } from "react-router-dom";
import { TeamProvider } from "@/contexts/team/TeamContext.tsx";
import { useAuth } from "@/contexts/auth/useAuth.ts";

export default function TeamProviderLayout() {
    const { user, isLoading } = useAuth();
    const { teamId } = useParams();
    const location = useLocation();

    if (isLoading) {
        return null;
    }

    if (!user) {
        return null;
    }

    if (!user.profileCompleted && teamId) {
        return (
            <Navigate
                to="/complete-profile"
                replace
                state={{
                    fromTeamId: teamId,
                    fromPath: location.pathname,
                }}
            />
        );
    }

    return (
        <TeamProvider>
            <Outlet />
        </TeamProvider>
    );
}
