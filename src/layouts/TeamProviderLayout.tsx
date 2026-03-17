// src/layouts/TeamProviderLayout.tsx

import { Outlet } from "react-router-dom";
import { TeamProvider } from "@/contexts/team/TeamContext.tsx";
import { AgendaProvider } from "@/contexts/agenda/AgendaContext.tsx";

export default function TeamProviderLayout() {

    return (
        <TeamProvider>
            <AgendaProvider>
                <Outlet />
            </AgendaProvider>
        </TeamProvider>
    );
}
