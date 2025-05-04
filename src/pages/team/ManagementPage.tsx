import {JSX, useEffect, useState} from "react";
import { useAuth } from "../../context/AuthContext.tsx";
import { useParams } from "react-router-dom";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import {Settings, Users} from "lucide-react";

interface Member {
    steamId: string;
    nickname: string;
    avatarUrl: string;
    role: string;
    customUsername?: string;
}

type TabKey = "MEMBRES" | "TEAM";

const tabs: { key: TabKey; label: string; icon: JSX.Element }[] = [
    { key: "MEMBRES", label: "MEMBRES", icon: <Users size={16} /> },
    { key: "TEAM", label: "TEAM", icon: <Settings size={16} /> },
];

const roles = ["Owner", "Manager", "Player", "Coach", "Analyst"];

export default function ManagementPage() {
    const { user } = useAuth();
    const { teamId } = useParams();
    const [activeTab, setActiveTab] = useState<TabKey>("MEMBRES");
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        if (!teamId) return;

        fetch(`/api/teams/${teamId}/members`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setMembers(data);
                else throw new Error("Invalid members format");
            })
            .catch(() => toast.error("Erreur lors du chargement des membres."));
    }, [teamId]);

    const handleRemove = async (steamId: string) => {
        toast.error("Suppression non encore implémentée");
    };

    const [inviteGenerated, setInviteGenerated] = useState(false);

    const handleGenerateInvite = async () => {
        if (!teamId || !user?.steamId) {
            toast.error("Identifiants manquants pour générer l'invitation.");
            return;
        }

        try {
            const res = await fetch(`/api/teams/${teamId}/invitations?steamId=${user.steamId}`, {
                method: "POST"
            });

            if (!res.ok) throw new Error();

            const data = await res.json();

            await navigator.clipboard.writeText(data.inviteUrl);
            setInviteGenerated(true);
            setTimeout(() => setInviteGenerated(false), 1600);
        } catch (err) {
            toast.error("Erreur lors de la génération du lien.");
        }
    };


    const handleRoleChange = (steamId: string, newRole: string) => {
        setMembers(prev =>
            prev.map(m => (m.steamId === steamId ? { ...m, role: newRole } : m))
        );
        toast.success(`Rôle modifié en ${newRole}`);
    };

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                {/* Onglets */}
                <div className="flex overflow-x-auto mb-9 pb-4 border-b border-neutral-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative min-w-[140px] flex flex-col items-center justify-center transition group ${
                                activeTab === tab.key
                                    ? "text-indigo-400 font-semibold"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-2 text-base tracking-wide uppercase">
                                {tab.icon}
                                {tab.label}
                            </div>

                            {/* Highlight élargi */}
                            <span
                                className={`mt-3 h-[3px] w-16 rounded-full transition-all duration-300 ${
                                    activeTab === tab.key
                                        ? "bg-indigo-500 scale-x-100"
                                        : "bg-transparent scale-x-0 group-hover:scale-x-75"
                                }`}
                            />
                        </button>
                    ))}
                </div>

                {activeTab === "MEMBRES" && (
                    <div className="ml-4">
                        <button
                            onClick={handleGenerateInvite}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition font-medium
                            ${inviteGenerated ? "bg-green-600 hover:bg-green-500" : "bg-indigo-600 hover:bg-indigo-500"}
                            text-white
                        `}
                        >
                            {inviteGenerated ? (
                                <>
                                    <span className="text-sm">Lien copié !</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                                    </svg>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm">Générer un lien d'invitation</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Membres */}
                {activeTab === "MEMBRES" && (
                    <div className="space-y-3 mt-6 ml-4">
                        {members.map(member => (
                            <div
                                key={member.steamId}
                                className="bg-neutral-800 rounded-lg px-4 py-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={member.avatarUrl}
                                        className="w-9 h-9 rounded-full"
                                        alt={member.nickname}
                                    />
                                    <span className="text-white text-sm">
                                        {member.customUsername || member.nickname}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.steamId, e.target.value)}
                                        className="bg-neutral-700 text-sm text-white p-2 rounded"
                                    >
                                        {roles.map(role => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={() => handleRemove(member.steamId)}
                                        className="text-red-400 hover:text-red-300 rounded-full p-1 hover:bg-red-900 transition"
                                        title="Supprimer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "TEAM" && (
                    <div className="text-center text-gray-400 mt-10">
                        Fonctionnalité à venir : édition des infos d’équipe.
                    </div>
                )}
            </div>
        </div>
    );
}