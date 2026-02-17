import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth.ts";
import { useTranslation } from "react-i18next";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function RootRedirect() {
    const { t } = useTranslation();
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <FullScreenLoader
                title={t("common.loading")}
                subtitle={t("auth.redirecting")}
            />
        );
    }

    if (user) {
        return <Navigate to="/select-team" replace />;
    }

    return <Navigate to="/login" replace />;
}
