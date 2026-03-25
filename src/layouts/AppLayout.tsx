import { Outlet } from "react-router-dom";
import { usePageTitle } from "@/shared/hooks/usePageTitle";

/**
 * AppLayout - Container principal minimaliste
 * Chaque feature gère sa propre navigation interne
 */
export default function AppLayout() {
    usePageTitle();

    return (
        <div className="h-screen bg-neutral-950 text-white overflow-hidden">
            <Outlet />
        </div>
    );
}
