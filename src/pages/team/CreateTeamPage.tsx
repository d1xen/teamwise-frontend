import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTeam } from "@/api/endpoints/team.api";
import type { CreateTeamRequest } from "@/api/types/team";

export default function CreateTeamPage() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [tag, setTag] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !tag.trim()) {
            setError("Team name and tag are required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload: CreateTeamRequest = {
                name: name.trim(),
                tag: tag.trim(),
                game: "CS2",
            };

            const team = await createTeam(payload);

            // 🔁 redirection EXPLICITE après création
            navigate(`/team/${team.id}/management`);
        } catch {
            setError("An error occurred while creating the team");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-neutral-800 rounded-xl p-6 space-y-6"
            >
                <h1 className="text-2xl font-semibold text-center">
                    Create a new team
                </h1>

                {error && (
                    <div className="text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm text-gray-300">
                        Team name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="My Esport Team"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-sm text-gray-300">
                        Team tag
                    </label>
                    <input
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value.toUpperCase())}
                        maxLength={5}
                        className="w-full px-3 py-2 rounded bg-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="TAG"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50"
                >
                    {loading ? "Creating…" : "Create team"}
                </button>
            </form>
        </div>
    );
}
