import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth/useAuth";
import { setToken } from "@/shared/utils/storage/tokenStorage";
import FullScreenLoader from "@/shared/components/FullScreenLoader";

export default function LoginSuccessPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        const token = params.get("token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        setToken(token);
        void login(token);

        const returnUrl = sessionStorage.getItem("tw_return_url");
        sessionStorage.removeItem("tw_return_url");

        setTimeout(() => {
            navigate(returnUrl || "/select-team", { replace: true });
        }, 300);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return <FullScreenLoader />;
}
