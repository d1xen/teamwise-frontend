import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/ui/Loader";

export default function RootRedirect() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center text-white">
                <Loader />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/select-team" replace />;
    }

    return <Navigate to="/login" replace />;
}
