import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateTeamPage() {
    const [name, setName] = useState("");
    const [tag, setTag] = useState("");
    const [game, setGame] = useState("CS2");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const steamId = localStorage.getItem("steamId");

        if (!steamId) {
            alert("Utilisateur non connecté.");
            return;
        }

        const response = await fetch("/api/teams", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, tag, game }),
        });

        if (response.ok) {
            const data = await response.json();
            navigate(`/team/${data.id}`);
        } else {
            const err = await response.json();
            alert(`Erreur : ${err.message || "Impossible de créer l'équipe."}`);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold">Créer une équipe</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de l'équipe"
                    className="w-full border p-2 rounded"
                    required
                />
                <input
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Tag de l'équipe"
                    className="w-full border p-2 rounded"
                />
                <input
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    placeholder="Jeu (ex: CS2)"
                    className="w-full border p-2 rounded"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Créer l'équipe
                </button>
            </form>
        </div>
    );
}
