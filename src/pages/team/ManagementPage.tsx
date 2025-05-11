import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Settings, Users} from "lucide-react";
import { useRequiredUser } from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import TeamTabs from "../../components/ui/TeamTabs.tsx";
import InviteButton from "../../components/ui/InviteButton.tsx";
import MembersList from "../../components/ui/MembersList.tsx";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader.tsx";

interface Member {
    steamId: string;
    nickname: string;
    avatarUrl: string;
    role: string;
    isOwner: boolean;
    customUsername?: string;
}

export type TabKey = "MEMBRES" | "TEAM";

export default function ManagementPage() {
    const user = useRequiredUser();
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);

    const [activeTab, setActiveTab] = useState<TabKey>("MEMBRES");
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [inviteGenerated, setInviteGenerated] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const roleOrder = ["MANAGER", "COACH", "ANALYST", "CAPTAIN", "PLAYER"];

    const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
        { key: "MEMBRES", label: t("management.tab_members"), icon: <Users size={16} /> },
        { key: "TEAM", label: t("management.tab_team"), icon: <Settings size={16} /> }
    ];

    useTeamAccessGuard(teamId);

    const isCurrentUserStaff = useMemo(() => {
        const me = members.find((m) => m.steamId === user?.steamId);
        if (!me) return false;
        return me.isOwner || ["MANAGER", "COACH", "CAPTAIN", "ANALYST"].includes(me.role);
    }, [members, user]);

    const isCurrentUserOwner = useMemo(() => {
        const me = members.find((m) => m.steamId === user?.steamId);
        return me?.isOwner ?? false;
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

        setIsLoadingMembers(true);

        fetch(`/api/teams/${teamId}/members?steamId=${user.steamId}`)
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 403 || res.status === 404) {
                        toast.error(t("management.not_in_team"));
                        navigate("/home");
                    }
                    throw new Error();
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setMembers(data.map((m: any) => {
                        const { owner, ...rest } = m;
                        return { ...rest, isOwner: owner };
                    }));
                }
            })
            .finally(() => setIsLoadingMembers(false));
    }, [teamId, user?.steamId, t, navigate]);

    useEffect(() => {
        fetch(`/api/teams/roles`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setRoles(data);
            })
            .catch(() => toast.error(t("management.role_fetch_error")));
    }, [t]);

    const handleGenerateInvite = async () => {
        if (!teamId || !user?.steamId) {
            toast.error(t("management.invite_error"));
            return;
        }

        try {
            const res = await fetch(`/api/invitations?teamId=${teamId}&steamId=${user.steamId}`, {
                method: "POST"
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const baseUrl = window.location.origin;
            await navigator.clipboard.writeText(`${baseUrl}/invite/${data.inviteUrl}`);
            setInviteGenerated(true);
            setTimeout(() => setInviteGenerated(false), 1600);
            toast.success(t("management.invite_success"));
        } catch {
            toast.error(t("management.invite_error"));
        }
    };

    const handleRemove = async (steamId: string) => {
        if (!user?.steamId || !teamId || steamId === user.steamId) return;
        if (!confirm(t("management.remove_confirm"))) return;

        try {
            const res = await fetch(`/api/teams/${teamId}/members/${steamId}?steamIdRequester=${user.steamId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error();
            setMembers(prev => prev.filter(m => m.steamId !== steamId));
            toast.success(t("management.remove_success"));
        } catch {
            toast.error(t("management.remove_error"));
        }
    };

    const handleLeaveTeam = async () => {
        if (!user?.steamId || !teamId) return;
        if (!confirm(t("management.leave_confirm"))) return;

        try {
            const res = await fetch(`/api/teams/${teamId}/leave?steamId=${user.steamId}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const errorText = await res.text();
                if (errorText.includes("OWNER")) {
                    toast.error(t("management.leave_owner_error"));
                } else {
                    toast.error(t("management.leave_error"));
                }
                return;
            }
            toast.success(t("management.leave_success"));
            navigate("/home");
        } catch {
            toast.error(t("management.leave_network_error"));
        }
    };

    const handleRoleChange = async (steamId: string, newRole: string) => {
        if (!teamId || !user?.steamId) return;

        try {
            const res = await fetch(
                `/api/teams/${teamId}/members/${steamId}?updatedBy=${user.steamId}&newRole=${newRole}`,
                { method: "PATCH" }
            );

            if (!res.ok) {
                const msg = await res.text();
                toast.error(msg || t("management.role_change_error"));
                return;
            }

            setMembers(prev =>
                prev.map(m => m.steamId === steamId ? { ...m, role: newRole } : m)
            );
            toast.success(t("management.role_change_success", { role: newRole }));
        } catch {
            toast.error(t("management.role_change_error"));
        }
    };

    const handleToggleOwner = async (steamId: string, currentlyOwner: boolean) => {
        if (!teamId || !user?.steamId) return;

        try {
            const res = await fetch(
                `/api/teams/${teamId}/owner?steamId=${steamId}&updatedBy=${user.steamId}`,
                { method: currentlyOwner ? "DELETE" : "POST" }
            );

            if (!res.ok) {
                const msg = await res.text();
                toast.error(msg || t("management.owner_toggle_error"));
                return;
            }

            setMembers(prev =>
                prev.map(m => m.steamId === steamId ? { ...m, isOwner: !currentlyOwner } : m)
            );

            toast.success(
                currentlyOwner
                    ? t("management.owner_remove_success")
                    : t("management.owner_toggle_success")
            );
        } catch {
            toast.error(t("management.owner_toggle_network"));
        }
    };

    return (
        <div className="text-white px-6 pt-12">
            <div className="max-w-7xl mx-auto">
                <TeamTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    onTabChange={(tabKey: string) => setActiveTab(tabKey as TabKey)}
                />

                {activeTab === "MEMBRES" && (
                    <>
                        <InviteButton
                            isStaff={isCurrentUserStaff}
                            isOwner={isCurrentUserOwner}
                            onClick={handleGenerateInvite}
                            inviteGenerated={inviteGenerated}
                        />

                        {isLoadingMembers ? (
                            <div className="flex justify-center mt-10">
                                <Loader />
                            </div>
                        ) : (
                            <MembersList
                                members={members}
                                roles={roles}
                                currentUserSteamId={user.steamId}
                                isCurrentUserStaff={isCurrentUserStaff}
                                isCurrentUserOwner={isCurrentUserOwner}
                                roleOrder={roleOrder}
                                openMenu={openMenu}
                                setOpenMenu={setOpenMenu}
                                menuRefs={menuRefs}
                                onMemberRoleChange={handleRoleChange}
                                onOwnerToggle={handleToggleOwner}
                                onMemberRemove={handleRemove}
                                onSelfLeave={handleLeaveTeam}
                            />
                        )}
                    </>
                )}


                {activeTab === "TEAM" && (
                    <div className="text-center text-gray-400 mt-10">
                        {t("management.feature_coming")}
                    </div>
                )}
            </div>
        </div>
    );
}
