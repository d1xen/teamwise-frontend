import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/layout/AppHeader.tsx";
import { useAuth } from "../../context/AuthContext.tsx";
import { limitedToast as toast } from "../../utils/limitedToast.ts";

interface Team {
    id: number;
    name: string;
    tag: string;
}

const TeamCard = ({ team, isMenuOpen, onOpenMenu, onLeaveTeam }: {
    team: Team;
    isMenuOpen: boolean;
    onOpenMenu: (id: number) => void;
    onLeaveTeam: (id: number) => void;
}) => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onOpenMenu(-1);
            }
        };
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [onOpenMenu]);

    return (
        <div
            className="w-80 h-72 relative group cursor-pointer bg-neutral-800 p-6 rounded-2xl border border-neutral-700 transition-transform duration-200 transform hover:scale-[1.03] overflow-hidden flex flex-col justify-between"
            onClick={() => {
                localStorage.setItem("teamId", String(team.id));
                navigate(`/app/team/${team.id}/management`);
            }}
        >
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onOpenMenu(team.id);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-neutral-700 rounded-full cursor-pointer z-20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                     stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01"/>
                </svg>
            </div>

            {isMenuOpen && (
                <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-14 right-4 z-30 bg-neutral-800 border border-neutral-700 rounded shadow"
                >
                    <button
                        onClick={() => onLeaveTeam(team.id)}
                        className="px-4 py-2 text-sm text-red-400 hover:text-red-300 w-full text-left"
                    >
                        Quitter l'équipe
                    </button>
                </div>
            )}

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                    <p className="text-indigo-400 font-medium mt-1">Tag : {team.tag}</p>
                </div>
            </div>
        </div>
    );
};

export default function HomePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [joinUrl, setJoinUrl] = useState("");

    const hasReachedTeamLimit = teams.length >= 3;

    const fetchTeams = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/teams/by-user?steamId=${user.steamId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTeams(data);
                if (!localStorage.getItem("teamId") && data.length > 0) {
                    localStorage.setItem("teamId", String(data[0].id));
                }
            } else {
                setTeams([]);
            }
        } catch (err) {
            console.error("Erreur lors du chargement des équipes :", err);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, [user]);

    const handleLeaveTeam = async (teamId: number) => {
        if (!user) return;
        const confirmed = window.confirm("Es-tu sûr de vouloir quitter cette équipe ?");
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/teams/${teamId}/leave?steamId=${user.steamId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setTeams(prev => prev.filter(t => t.id !== teamId));
                toast.success("Tu as quitté l'équipe !");
                const storedTeamId = localStorage.getItem("teamId");
                if (storedTeamId && parseInt(storedTeamId) === teamId) {
                    localStorage.removeItem("teamId");
                }
            } else {
                toast.error("Impossible de quitter l'équipe.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Une erreur est survenue.");
        }
    };

    const handleJoinTeam = async () => {
        if (!user) return;
        if (hasReachedTeamLimit) {
            toast.info("Nombre maximum d'équipe atteint.");
            return;
        }

        try {
            const res = await fetch(`/api/teams/join-team?steamId=${user.steamId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteUrl: joinUrl })
            });

            if (res.ok) {
                toast.success("Équipe rejointe avec succès !");
                await fetchTeams();
                setJoinUrl("");
            } else {
                const errorText = await res.text();
                if (errorText.includes("expiré") || errorText.includes("utilisé")) {
                    toast.error("Lien d'invitation expiré ou déjà utilisé.");
                } else if (errorText.includes("déjà partie")) {
                    toast.info("Tu es déjà dans cette équipe.");
                } else {
                    toast.error("Lien invalide ou erreur lors de l'invitation.");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Erreur réseau ou inattendue.");
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen text-white bg-neutral-900 flex flex-col">
            <AppHeader user={user} onLogout={logout} />

            <main className="flex-1 flex flex-col justify-center items-center px-6 py-10">
                <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
                    {teams.map(team => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            isMenuOpen={openMenuId === team.id}
                            onOpenMenu={(id) => setOpenMenuId(id)}
                            onLeaveTeam={handleLeaveTeam}
                        />
                    ))}

                    <div
                        onClick={() => {
                            if (hasReachedTeamLimit) {
                                toast.info("Nombre maximum d'équipe atteint.");
                                return;
                            }
                            navigate("/app/create-team");
                        }}
                        className={`w-80 h-72 border-2 border-dashed p-6 rounded-2xl transition flex flex-col justify-center items-center text-center ${hasReachedTeamLimit ? 'border-neutral-700 bg-neutral-800 cursor-default opacity-50' : 'cursor-pointer border-indigo-500 hover:bg-neutral-800'}`}
                    >
                        <p className="text-gray-300 text-lg">Créer une nouvelle équipe et inviter vos joueurs.</p>
                        <p className="text-indigo-400 font-semibold mt-4 text-2xl">+ Nouvelle équipe</p>
                    </div>
                </div>

                <div className="flex justify-center mt-10">
                    <div className={`flex gap-2 items-center bg-neutral-800 border p-4 rounded-md shadow-md ${hasReachedTeamLimit ? 'border-neutral-700 opacity-50 cursor-default' : 'border-neutral-600'}`}>
                        <input
                            type="text"
                            value={joinUrl}
                            onChange={(e) => setJoinUrl(e.target.value)}
                            placeholder="URL d'invitation"
                            className="px-4 py-2 rounded bg-neutral-900 border border-neutral-700 text-white w-80"
                            disabled={hasReachedTeamLimit}
                        />
                        <button
                            onClick={handleJoinTeam}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-semibold"
                        >
                            Rejoindre
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
