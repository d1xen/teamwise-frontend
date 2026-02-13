import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
    sub: string;
    nickname: string;
    avatarUrl?: string;
    hasTeam: boolean;
    profileCompleted: boolean;
};

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

        localStorage.setItem("jwt", token);

        const decoded = jwtDecode<JwtPayload>(token);

        login({
            steamId: decoded.sub,
            nickname: decoded.nickname,
            avatarUrl: decoded.avatarUrl ?? null,
            hasTeam: decoded.hasTeam,
            profileCompleted: decoded.profileCompleted,
        });

        navigate("/select-team", { replace: true });
    }, [params, navigate, login]);

    return null;
}
