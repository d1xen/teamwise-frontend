import { Outlet } from "react-router-dom";
import { TeamProvider } from "@/contexts/team/TeamContext.tsx";

export default function TeamProviderLayout() {
    return (
        <TeamProvider>
            <Outlet />
        </TeamProvider>
    );
}
