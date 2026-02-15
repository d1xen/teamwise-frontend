import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import Loader from "@/shared/components/Loader";

export default function RequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
