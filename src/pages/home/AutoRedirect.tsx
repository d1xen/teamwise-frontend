import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RememberService } from "../../services/RememberService";

export default function AutoRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const steamId = RememberService.load();

        if (steamId) {
            localStorage.setItem("steamId", steamId);
            navigate("/app/home");
        } else {
            navigate("/landing");
        }
    }, [navigate]);

    return <p className="text-white p-6">Redirection en cours...</p>;
}
