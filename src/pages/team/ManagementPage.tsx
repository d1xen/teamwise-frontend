import { JSX, useEffect, useMemo, useRef, useState } from "react";
import {useRequiredUser} from "../../context/AuthContext.tsx";
import { useParams } from "react-router-dom";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import {Settings, User, Users} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {useTeamAccessGuard} from "../../hook/useTeamAccessGuard.ts";

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

export default function ManagementPage() {
    const user = useRequiredUser();
    const { teamId } = useParams();
    const [activeTab, setActiveTab] = useState<TabKey>("MEMBRES");
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [inviteGenerated, setInviteGenerated] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const roleOrder = ["OWNER", "MANAGER", "COACH", "CAPTAIN", "PLAYER"];
    const navigate = useNavigate();

    useTeamAccessGuard(teamId);

    const countOwners = () => members.filter(m => m.role === "OWNER").length;

    const isCurrentUserStaff = useMemo(() => {
        const me = members.find(m => String(m.steamId) === String(user?.steamId));
        return me ? ["OWNER", "MANAGER", "COACH"].includes(me.role) : false;
    }, [members, user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenu) {
                const ref = menuRefs.current[openMenu];
                if (ref && !ref.contains(event.target as Node)) {
                    setOpenMenu(null);
                }
            }
        };
        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, [openMenu]);

    useEffect(() => {
        if (!teamId || !user?.steamId) return;

        fetch(`/api/teams/${teamId}/members?steamId=${user.steamId}`)
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 403 || res.status === 404) {
                        toast.error("Tu ne fais plus partie de cette équipe.");
                        navigate("/home");
                    }
                    throw new Error();
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setMembers(data);
                else throw new Error("Format invalide");
            })
            .catch(() => {
                // Silencieux, toast déjà géré si 403/404
            });
    }, [teamId, user]);

    useEffect(() => {
        fetch(`/api/teams/roles`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setRoles(data);
                else throw new Error("Format de rôle invalide");
            })
            .catch(() => toast.error("Impossible de récupérer les rôles disponibles."));
    }, []);

    const handleRemove = async (steamId: string) => {
        if (!user?.steamId || !teamId || steamId === user.steamId) return;
        if (!confirm("Supprimer ce membre de l'équipe ?")) return;

        try {
            const res = await fetch(`/api/teams/${teamId}/members/${steamId}?steamIdRequester=${user.steamId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setMembers(prev => prev.filter(m => m.steamId !== steamId));
            toast.success("Membre supprimé.");
        } catch {
            toast.error("Erreur lors de la suppression du membre.");
        }
    };

    const handleLeaveTeam = async (teamId: number) => {
        if (!user?.steamId || !confirm("Es-tu sûr de vouloir quitter cette équipe ?")) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/leave?steamId=${user.steamId}`, { method: "DELETE" });
            if (!res.ok) {
                const errorText = await res.text();
                if (errorText.includes("OWNER")) toast.error("Tu ne peux pas quitter l’équipe : tu es le seul OWNER.");
                else toast.error("Impossible de quitter l'équipe.");
                return;
            }
            toast.success("Tu as quitté l'équipe.");
            navigate("/home");
        } catch {
            toast.error("Erreur lors de la sortie d'équipe.");
        }
    };

    const handleGenerateInvite = async () => {
        if (!teamId || !user?.steamId) return toast.error("Identifiants manquants pour générer l'invitation.");
        try {
            const res = await fetch(`/api/invitations?teamId=${teamId}&steamId=${user.steamId}`, { method: "POST" });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const baseUrl = window.location.origin;
            await navigator.clipboard.writeText(`${baseUrl}/invite/${data.inviteUrl}`);
            setInviteGenerated(true);
            setTimeout(() => setInviteGenerated(false), 1600);
        } catch {
            toast.error("Erreur lors de la génération du lien.");
        }
    };

    const handleRoleChange = async (steamId: string, newRole: string) => {
        if (!teamId || !user?.steamId || steamId === user.steamId) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/members/${steamId}?updatedBy=${user.steamId}&newRole=${newRole}`, { method: "PATCH" });
            if (!res.ok) {
                const errorText = await res.text();
                if (errorText.includes("OWNER")) toast.error("Impossible de modifier ce rôle : il doit toujours y avoir au moins un OWNER.");
                else toast.error("Impossible de modifier le rôle.");
                return;
            }
            setMembers(prev => prev.map(m => m.steamId === steamId ? { ...m, role: newRole } : m));
            toast.success(`Rôle modifié en ${newRole}`);
        } catch {
            toast.error("Erreur lors de la modification du rôle.");
        }
    };

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex overflow-x-auto mb-9 pb-4 border-b border-neutral-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative min-w-[140px] flex flex-col items-center justify-center transition group ${
                                activeTab === tab.key ? "text-indigo-400 font-semibold" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-2 text-base tracking-wide uppercase">
                                {tab.icon}
                                {tab.label}
                            </div>
                            <span className={`mt-3 h-[3px] w-16 rounded-full transition-all duration-300 ${
                                activeTab === tab.key ? "bg-indigo-500 scale-x-100" : "bg-transparent scale-x-0 group-hover:scale-x-75"
                            }`} />
                        </button>
                    ))}
                </div>

                {activeTab === "MEMBRES" && (
                    <>
                        <div className="ml-4">
                            <button
                                onClick={() => {
                                    if (!isCurrentUserStaff) {
                                        toast.info("Seuls les membres du staff peuvent générer une invitation.");
                                        return;
                                    }
                                    handleGenerateInvite();
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition font-medium ${
                                    inviteGenerated ? "bg-green-600 hover:bg-green-500" : "bg-indigo-600 hover:bg-indigo-500"
                                } text-white ${!isCurrentUserStaff ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span className="text-sm">
                                    {inviteGenerated ? "Lien copié !" : "Générer un lien d'invitation"}
                                </span>
                            </button>
                        </div>

                        <div className="space-y-3 mt-6 ml-4">
                            {[...members]
                                .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
                                .map((member) => {
                                    const isMe = String(member.steamId) === String(user?.steamId);
                                    const isLastOwner = member.role === "OWNER" && countOwners() === 1;
                                    return (
                                        <div
                                            key={member.steamId}
                                            className="bg-neutral-800 rounded-md px-4 py-3 flex items-center justify-between relative"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={member.avatarUrl}
                                                    className="w-9 h-9 rounded-full"
                                                    alt={member.nickname}
                                                />
                                                <span
                                                    className="text-white text-base font-medium flex items-center gap-2">
                                                    {member.customUsername || member.nickname}
                                                    {isMe && (
                                                        <User className="w-5 h-5 text-yellow-600 stroke-2" />
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-full max-w-xs">
                                                <select
                                                        disabled={!isCurrentUserStaff || isMe || isLastOwner}
                                                        value={member.role}
                                                        onChange={(e) => handleRoleChange(member.steamId, e.target.value)}
                                                        className={`
                                                          bg-neutral-700 text-sm text-white w-full px-3 py-2 pr-10 rounded-md
                                                          border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500
                                                          disabled:opacity-50 appearance-none transition
                                                        `}
                                                    >
                                                        {[...new Set(roles)].map(role => (
                                                            <option key={role} value={role}>
                                                                {role}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Chevron icon */}
                                                    <div
                                                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  d="M19 9l-7 7-7-7"/>
                                                        </svg>
                                                    </div>
                                                </div>
                                                {isCurrentUserStaff && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenu(openMenu === member.steamId ? null : member.steamId);
                                                            }}
                                                            className="text-white hover:text-gray-300 px-2"
                                                            title="Options"
                                                        >
                                                            ⋮
                                                        </button>
                                                        {openMenu === member.steamId && (
                                                            <div
                                                                ref={(el) => {
                                                                    menuRefs.current[member.steamId] = el;
                                                                }}
                                                                className="absolute right-0 top-8 z-10 bg-neutral-800 border border-neutral-600 rounded shadow px-4 py-2 min-w-[200px] whitespace-nowrap"
                                                            >
                                                                {isMe ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleLeaveTeam(Number(teamId));
                                                                            setOpenMenu(null);
                                                                        }}
                                                                        className="block text-sm text-red-400 hover:text-red-300 hover:bg-neutral-700 w-full text-left"
                                                                    >
                                                                        Quitter l'équipe
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleRemove(member.steamId);
                                                                            setOpenMenu(null);
                                                                        }}
                                                                        className="block text-sm text-red-400 hover:text-red-300 hover:bg-neutral-700 w-full text-left"
                                                                    >
                                                                        Exclure {member.customUsername || member.nickname}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </>
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
