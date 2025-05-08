import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext.tsx";

export default function ProtectedLayout() {
    const { user, loading } = useAuth(); // Obtenir l'utilisateur et l'état de chargement

    // Si les données sont encore en cours de chargement, afficher un message ou un loader
    if (loading) {
        return <div className="text-white p-6">Chargement...</div>; // Afficher un message de chargement ou spinner
    }

    // Si l'utilisateur n'est pas authentifié (user est null), rediriger vers la page de landing (ou login)
    if (!user) {
        return <Navigate to="/landing" replace />; // Redirection vers la page de login/landing
    }

    // Si l'utilisateur est authentifié et les données sont chargées, afficher le contenu de l'outlet
    return <Outlet />;
}
