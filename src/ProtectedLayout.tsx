// src/components/layout/ProtectedLayout.tsx
import { useAuth } from "./context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="text-white p-6">Chargement...</div>;
    }

    if (!user) {
        return <Navigate to="/landing" replace />;
    }

    return <Outlet />;
}
