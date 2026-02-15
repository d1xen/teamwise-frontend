import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import { setToken } from "@/shared/utils/storage/tokenStorage";

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

        navigate("/select-team", { replace: true });
    }, [params, navigate, login]);

    return null;
}
