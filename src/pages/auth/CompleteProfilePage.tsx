import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../../context/AuthContext.tsx";

interface UserProfile {
    customUsername: string;
    firstName: string;
    lastName: string;
    email: string;
    [key: string]: any;
}

export default function CompleteProfilePage() {
    const navigate = useNavigate();
    const steamId = localStorage.getItem("steamId");
    const { refreshUser } = useAuth();

    const [formData, setFormData] = useState<UserProfile>({
        customUsername: "",
        firstName: "",
        lastName: "",
        email: "",
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!steamId) {
            console.log("Pas de steamId, redirection vers /landing");
            navigate("/landing");
            return;
        }

        fetch(`/api/auth/steam/me?steamId=${steamId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Erreur HTTP: " + res.status);
                return res.json();
            })
            .then(user => {
                console.log("Fetched user:", user);
                const isComplete = user.customUsername && user.firstName && user.lastName && user.email;

                if (isComplete) {
                    navigate("/app/home");
                } else {
                    setFormData({
                        customUsername: user.customUsername || "",
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        email: user.email || "",
                    });
                }
            })
            .catch(err => {
                console.error("Erreur chargement profil:", err);
            })
            .finally(() => {
                console.log("Fin du chargement");
                setLoading(false);
            });
    }, [navigate, steamId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch(`/api/users/update-profile?steamId=${steamId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (response.ok && steamId) {
            await refreshUser(steamId);
            navigate("/app/home");
        } else {
            alert("Erreur lors de la mise à jour du profil.");
        }
    };

    if (loading) return <div className="text-white p-6">Chargement...</div>;

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
            <form
                onSubmit={handleSubmit}
                className="bg-neutral-800 p-8 rounded-lg shadow-lg w-full max-w-md space-y-4"
            >
                <h2 className="text-2xl font-bold mb-2">Complétez votre profil</h2>
                <input
                    type="text"
                    name="customUsername"
                    placeholder="Pseudo"
                    value={formData.customUsername}
                    onChange={handleChange}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    required
                />
                <input
                    type="text"
                    name="firstName"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    required
                />
                <input
                    type="text"
                    name="lastName"
                    placeholder="Nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded"
                >
                    Enregistrer et continuer
                </button>
            </form>
        </div>
    );
}
