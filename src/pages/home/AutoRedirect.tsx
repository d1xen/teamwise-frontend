import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RememberService } from "../../services/RememberService";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader.tsx";

export default function AutoRedirect() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const steamId = RememberService.load();

        if (steamId) {
            localStorage.setItem("steamId", steamId);
            navigate("/app/home");
        } else {
            navigate("/landing");
        }
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-900">
            <div className="flex flex-col items-center gap-4 text-white">
                <Loader />
                <p>{t("auth.redirecting")}</p>
            </div>
        </div>
    );
}
