import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth.ts";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function RootRedirect() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (user) {
        return <Navigate to="/select-team" replace />;
    }

    return <Navigate to="/login" replace />;
}
