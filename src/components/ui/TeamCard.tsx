import { useNavigate } from "react-router-dom";
import { useTeamContext } from "../../context/TeamContext";
import { useAuth } from "../../context/AuthContext";

interface Team {
    id: number;
    name: string;
    tag: string;
    logoUrl?: string;
}

interface Props {
    team: Team;
}

export const TeamCard = ({ team }: Props) => {
    const navigate = useNavigate();
    const { loadMembership } = useTeamContext();
    const { user } = useAuth();

    const handleSelect = async () => {
        localStorage.setItem("teamId", String(team.id));
        if (user) {
            await loadMembership(String(team.id), user.steamId, true);
        }
        navigate(`/app/team/${team.id}/management`);
    };

    return (
        <div
            className="w-72 h-72 relative bg-neutral-800 rounded-2xl border border-neutral-700 transition-transform transform hover:scale-[1.03] hover:ring-2 hover:ring-indigo-500/30 transition duration-200 cursor-pointer overflow-hidden flex flex-col"
            onClick={handleSelect}
        >
            {/* logo */}
            {team.logoUrl && (
                <div className="flex justify-center mt-6 px-4">
                    <img
                        src={`http://localhost:8080${team.logoUrl}`}
                        alt={`${team.name} logo`}
                        className="h-40 max-h-48 object-contain"
                    />
                </div>
            )}

            {/* texte */}
            <div className="flex-grow flex items-end justify-start pb-6 px-6">
                <div className="text-left">
                    <h3 className="text-2xl font-bold text-white">{team.name}</h3>
                    <p className="text-indigo-400 font-medium mt-1">{team.tag}</p>
                </div>
            </div>
        </div>
    );
};
