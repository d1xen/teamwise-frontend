import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RememberService } from "../../services/RememberService";
import { useAuth } from "../../context/AuthContext.tsx";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader";

export default function LoginSuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, refreshUser, loading } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const steamId = searchParams.get("steamId");
        if (!steamId) {
            navigate("/landing");
            return;
        }

        localStorage.setItem("steamId", steamId);
        RememberService.save(steamId);

        refreshUser(steamId);
    }, [searchParams, refreshUser]);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            navigate("/landing");
            return;
        }

        const isComplete =
            user.customUsername &&
            user.firstName &&
            user.lastName &&
            user.email;

        if (!isComplete) {
            navigate("/complete-profile");
        } else {
            navigate("/app/home");
        }
    }, [user, loading, navigate]);

    return (
        <div className="p-8 text-center text-white">
            {t("auth.logging_in")}
            <Loader />
        </div>
    );
}
