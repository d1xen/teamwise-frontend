import { Outlet } from "react-router-dom";

/**
 * AppLayout - Container principal minimaliste
 * Chaque feature gère sa propre navigation interne
 */
export default function AppLayout() {
    return (
        <div className="h-screen bg-neutral-950 text-white overflow-hidden">
            <Outlet />
        </div>
    );
}
