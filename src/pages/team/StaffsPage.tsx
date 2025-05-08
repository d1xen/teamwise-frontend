import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import Flag from "react-world-flags";

interface StaffMember {
    id: number;
    nickname: string;
    firstName: string;
    lastName: string;
    nationality: string;
    age: number;
    role: string;
    staffPictureUrl: string;
}

export default function StaffsPage() {
    const { user } = useAuth();
    const { teamId } = useParams();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const navigate = useNavigate();

    useTeamAccessGuard(teamId);

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        fetch(`/api/teams/${teamId}/staffs`)
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) setStaff(data);
                else throw new Error("Format de données invalide");
            })
            .catch(() => toast.error("Impossible de récupérer le staff."));
    }, [teamId, user]);

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Staff de l’équipe</h1>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {staff.map(member => (
                        <div
                            key={member.id}
                            onClick={() => navigate(`/app/team/${teamId}/staffs/${member.id}`)}
                            className="bg-neutral-800 rounded p-4 cursor-pointer hover:shadow-lg hover:bg-neutral-700 transition"
                        >
                            <img
                                src={member.staffPictureUrl}
                                alt={member.nickname}
                                className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border border-neutral-600"
                            />
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">{member.nickname}</h2>
                                <p className="text-sm text-gray-400">
                                    {member.firstName} {member.lastName}
                                </p>
                                <div className="mt-2 flex items-center justify-center text-sm text-gray-300 gap-2">
                                    <Flag code={member.nationality} style={{width: 20, height: 15, borderRadius: 2}}/>
                                    <span className="uppercase">{member.nationality}</span>
                                    <span>{member.age} ans</span>
                                </div>
                                <div className="mt-2 text-xs text-indigo-400 font-semibold">{member.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {staff.length === 0 && (
                    <p className="text-center text-gray-500 mt-8">Aucun membre du staff trouvé pour cette équipe.</p>
                )}
            </div>
        </div>
    );
}
