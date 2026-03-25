import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function RequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
    }

    return <Outlet />;
}
