// src/pages/LoginSuccessPage.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginSuccessPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const steamId = searchParams.get("steamId");
        if (!steamId) {
            navigate("/");
            return;
        }

        localStorage.setItem("steamId", steamId);
        navigate("/home");
    }, [navigate, searchParams]);

    return (
        <div className="p-8 text-center">
            <p className="text-lg text-gray-700">Connexion en cours...</p>
        </div>
    );
}
