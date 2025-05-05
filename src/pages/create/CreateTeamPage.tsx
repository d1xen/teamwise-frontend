import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/layout/AppHeader.tsx";
import { useAuth } from "../../context/AuthContext.tsx";

export default function CreateTeamPage() {
    const navigate = useNavigate();
    const steamId = localStorage.getItem("steamId");
    const { user, logout } = useAuth();
    if (!user) return null;

    const [formData, setFormData] = useState({
        name: "",
        tag: "",
        game: "CS2"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch(`/api/teams?steamId=${steamId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            navigate("/app/home");
        } else {
            alert("Erreur lors de la création de l'équipe.");
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white overflow-hidden">
            <AppHeader user={user} onLogout={logout}/>

            <div className="relative flex justify-center px-4 pt-12">
                {/* Bouton retour positionné à gauche du formulaire */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute left-[calc(50%-290px)] top-[50%] translate-y-[-50%] bg-indigo-600 hover:bg-indigo-500 text-white w-11 h-11 rounded-full flex items-center justify-center transition"
                    title="Retour"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                    </svg>
                </button>

                {/* Formulaire centré mais légèrement vers le haut */}
                <form
                    onSubmit={handleSubmit}
                    className="mt-20 mb-12 bg-neutral-800 p-8 rounded-lg shadow-lg w-full max-w-md space-y-4"
                >
                    <h2 className="text-2xl font-bold mb-2">Créer une équipe</h2>
                    <input
                        type="text"
                        name="name"
                        placeholder="Nom de l'équipe"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                        required
                    />
                    <input
                        type="text"
                        name="tag"
                        placeholder="Tag (ex: G2, NAVI)"
                        value={formData.tag}
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-neutral-700 text-white placeholder-gray-400"
                    />
                    <select
                        name="game"
                        value={formData.game}
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-neutral-700 text-white"
                    >
                        <option value="CS2">Counter-Strike 2</option>
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded"
                    >
                        Créer l'équipe
                    </button>
                </form>
            </div>
        </div>
    );
}