import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function RequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
