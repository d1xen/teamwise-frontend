// src/App.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function App() {
    const navigate = useNavigate();

    useEffect(() => {
        const steamId = localStorage.getItem("steamId");
        console.log("Redirection initiale, steamId =", steamId);

        if (steamId) {
            navigate("/home");
        } else {
            navigate("/landing");
        }
    }, [navigate]);

    return <p>Redirection en cours...</p>;
}
