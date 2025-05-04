// src/App.tsx
import { useEffect } from "react";
import { useNavigate, RouterProvider } from "react-router-dom";
import router from "./router.tsx";

export default function App() {
    const navigate = useNavigate();

    useEffect(() => {
        const steamId = localStorage.getItem("steamId");
        console.log("Redirection initiale, steamId =", steamId);
        if (steamId) navigate("/home");
        else navigate("/landing");
    }, [navigate]);

    return <RouterProvider router={router} />;
}
