import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthResponse {
    steamId: string;
    nickname: string;
    avatarUrl: string;
    hasTeam: boolean;
    teamId: number | null;
}

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthResponse | null>(null);

    useEffect(() => {
        const steamId = localStorage.getItem("steamId");
        if (!steamId) {
            navigate("/");
            return;
        }

        fetch(`/api/auth/steam/me?steamId=${steamId}`)
            .then((res) => res.json())
            .then(setUser)
            .catch((err) => {
                console.error("Erreur lors du chargement de l'utilisateur:", err);
                navigate("/");
            });
    }, [navigate]);

    if (!user) return <div className="p-4">Chargement...</div>;

    return (

        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => {
                    localStorage.removeItem("steamId");
                    navigate("/");
                }}
                className="absolute top-4 right-4 text-sm text-red-600 hover:underline"
            >
                Se déconnecter
            </button>
            <div className="flex items-center space-x-4">
                <img
                    src={user.avatarUrl}
                    alt={user.nickname}
                    className="w-16 h-16 rounded-full border"
                />
                <div>
                    <h1 className="text-xl font-semibold">Bienvenue, {user.nickname}</h1>
                    <p className="text-gray-500 text-sm">Steam ID : {user.steamId}</p>
                </div>
            </div>

            {!user.hasTeam ? (
                <div
                    onClick={() => navigate("/create-team")}
                    className="cursor-pointer border border-dashed border-gray-400 p-6 rounded-xl hover:shadow-md transition"
                >
                    <p className="text-gray-600">Vous n'avez pas encore d'équipe</p>
                    <p className="text-blue-600 font-medium">Créer une équipe</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div
                        onClick={() => navigate(`/team/${user.teamId}`)}
                        className="cursor-pointer border p-6 rounded-xl hover:shadow-md transition"
                    >
                        <p className="text-gray-600">Votre équipe</p>
                        <p className="text-blue-600 font-medium">Accéder à mon équipe</p>
                    </div>

                    <div
                        onClick={() => navigate("/create-team")}
                        className="cursor-pointer border border-dashed border-gray-400 p-6 rounded-xl hover:shadow-md transition"
                    >
                        <p className="text-gray-600">Créer une nouvelle équipe</p>
                        <p className="text-blue-600 font-medium">Nouvelle équipe</p>
                    </div>
                </div>
            )}
        </div>
    );
}
