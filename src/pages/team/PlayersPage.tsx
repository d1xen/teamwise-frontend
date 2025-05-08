import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import { useAuth } from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import Flag from "react-world-flags";

interface Player {
    id: number;
    nickname: string;
    firstName: string;
    lastName: string;
    nationality: string;
    age: number;
    playerPictureUrl: string;
    inGameRole: string;
    isCaptain: boolean;
}

export default function PlayersPage() {
    const { user } = useAuth();
    const { teamId } = useParams();
    const [players, setPlayers] = useState<Player[]>([]);
    const navigate = useNavigate();

    useTeamAccessGuard(teamId);

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        fetch(`/api/teams/${teamId}/players`)
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setPlayers(data);
                else throw new Error("Format de données invalide");
            })
            .catch(() => toast.error("Impossible de récupérer les joueurs."));
    }, [teamId, user]);

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Joueurs de l’équipe</h1>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {players.map((player) => (
                        <div
                            key={player.id}
                            onClick={() => navigate(`/app/team/${teamId}/players/${player.id}`)}
                            className="bg-neutral-800 rounded-md p-4 cursor-pointer hover:shadow-lg hover:bg-neutral-700 transition"
                        >
                            <img
                                src={player.playerPictureUrl}
                                alt={`${player.nickname}`}
                                className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border border-neutral-600"
                            />
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">{player.nickname}</h2>
                                <p className="text-sm text-gray-400">
                                    {player.firstName} {player.lastName}
                                </p>
                                <div className="mt-2 flex items-center justify-center text-sm text-gray-300 gap-2">
                                    <Flag code={player.nationality} style={{width: 20, height: 15, borderRadius: 2}}/>
                                    <span className="uppercase">{player.nationality}</span>
                                    <span>{player.age} ans</span>
                                </div>
                                {player.isCaptain && (
                                    <div className="mt-2 text-xs text-indigo-400 font-semibold">Capitaine</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {players.length === 0 && (
                    <p className="text-center text-gray-500 mt-8">Aucun joueur trouvé pour cette équipe.</p>
                )}
            </div>
        </div>
    );
}
