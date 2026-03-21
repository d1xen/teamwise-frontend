import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import { setToken } from "@/shared/utils/storage/tokenStorage";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function LoginSuccessPage() {
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

        setTimeout(() => {
            navigate("/select-team", { replace: true });
        }, 1200);
    }, [params, navigate, login]);

    return <FullScreenLoader />;
}
