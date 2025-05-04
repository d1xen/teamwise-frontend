// src/pages/AutoRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AutoRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const steamId = localStorage.getItem("steamId");
        navigate(steamId ? "/home" : "/landing");
    }, [navigate]);

    return <p className="text-white p-6">Redirection en cours...</p>;
}