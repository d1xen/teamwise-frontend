import { Outlet } from "react-router-dom";
import { AppHeader } from "@/layouts/AppHeader.tsx";

export default function AppLayout() {
    return (
        <div className="h-screen bg-neutral-900 text-white flex flex-col">
            <AppHeader />
            <main className="flex-1 min-h-0 overflow-y-auto scrollbar-gutter-stable">
                <Outlet />
            </main>
        </div>
    );
}
