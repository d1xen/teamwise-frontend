import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import { useTranslation } from "react-i18next";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function RequireAuth() {
    const { t } = useTranslation();
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <FullScreenLoader
                title={t("common.loading")}
                subtitle={t("auth.redirecting")}
            />
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
