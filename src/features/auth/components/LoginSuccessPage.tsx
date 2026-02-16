import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/auth/useAuth";
import { setToken } from "@/shared/utils/storage/tokenStorage";
import { CheckCircle2 } from "lucide-react";
import teamwiseLogo from "@/shared/assets/teamwise-logo.png";

export default function LoginSuccessPage() {
    const { t } = useTranslation();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = params.get("token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setToken(token);
        void login(token);

        // Petit délai pour montrer le succès
        setTimeout(() => {
            navigate("/select-team", { replace: true });
        }, 1500);
    }, [params, navigate, login]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Content */}
            <div className="relative z-10 text-center space-y-6">
                <img
                    src={teamwiseLogo}
                    alt="TeamWise"
                    className="mx-auto w-32 h-auto mb-4 opacity-90"
                />

                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping bg-green-500/20 rounded-full" />
                        <div className="relative p-4 bg-green-500/10 rounded-full border-2 border-green-500/50">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-white">
                        {t("auth.login")} {t("common.success")}
                    </h2>
                    <p className="text-neutral-400">
                        {t("auth.redirecting")}
                    </p>
                </div>

                {/* Spinner */}
                <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-neutral-700 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            </div>
        </div>
    );
}
