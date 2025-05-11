import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {FileDown, Settings, Trash2, Users} from "lucide-react";
import { useRequiredUser } from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import TeamTabs from "../../components/ui/TeamTabs.tsx";
import InviteButton from "../../components/ui/InviteButton.tsx";
import MembersList from "../../components/ui/MembersList.tsx";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader.tsx";
import { useTeamContext } from "../../context/TeamContext.tsx";

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
    const { getMembership, loadMembership, isLoading } = useTeamContext();
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("MEMBRES");
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [inviteGenerated, setInviteGenerated] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const roleOrder = ["MANAGER", "COACH", "ANALYST", "CAPTAIN", "PLAYER"];

    useTeamAccessGuard(teamId);

    useEffect(() => {
        if (teamId && user?.steamId) {
            loadMembership(teamId, user.steamId, true);
        }
    }, [teamId, user?.steamId]);

    const currentMembership = getMembership(teamId!);
    const currentRole = currentMembership?.role || "";
    const currentIsOwner = currentMembership?.isOwner || false;
    const isCurrentUserStaff = useMemo(
        () => ["MANAGER", "COACH", "CAPTAIN", "ANALYST"].includes(currentRole),
        [currentRole]
    );

    const TABS: { key: TabKey; label: string; icon: JSX.Element }[] = [
        { key: "MEMBRES", label: t("management.tab_members"), icon: <Users size={16} /> },
        { key: "TEAM", label: t("management.tab_team"), icon: <Settings size={16} /> }
    ];

    const deleteModalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showDeleteConfirm && deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
                setShowDeleteConfirm(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showDeleteConfirm]);

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

    const fetchMembers = async (withLoading = true) => {
        if (!teamId || !user?.steamId) return;
        if (withLoading) setIsLoadingMembers(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/members?steamId=${user.steamId}`);
            if (!res.ok) {
                if (res.status === 403 || res.status === 404) {
                    toast.error(t("management.not_in_team"));
                    navigate("/home");
                }
                throw new Error();
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setMembers(data.map((m: any) => {
                    const { owner, ...rest } = m;
                    return { ...rest, isOwner: owner };
                }));
            }
        } catch {
            toast.error(t("management.member_fetch_error"));
        } finally {
            if (withLoading) setIsLoadingMembers(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [teamId, user?.steamId]);

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
            if (steamId === user.steamId) {
                await loadMembership(teamId, user.steamId, true);
            }
            await fetchMembers(true);
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
            await loadMembership(teamId, user.steamId, true);
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
            await loadMembership(teamId, user.steamId, true);
            await fetchMembers(true);
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
            await loadMembership(teamId, user.steamId, true);
            await fetchMembers(true);
            toast.success(
                currentlyOwner
                    ? t("management.owner_remove_success")
                    : t("management.owner_toggle_success")
            );
        } catch {
            toast.error(t("management.owner_toggle_network"));
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamId || !user?.steamId) return;

        try {
            const res = await fetch(`/api/teams/${teamId}?steamId=${user.steamId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();

            toast.success(t("management.delete_success"));
            navigate("/app/home");
        } catch {
            toast.error(t("management.delete_error"));
        }
    };

    if (isLoading || !currentMembership) {
        return <Loader />;
    }

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
                                isCurrentUserOwner={currentIsOwner}
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
                    <div className="flex flex-col gap-4 justify-start mt-10">
                        <InviteButton
                            isStaff={isCurrentUserStaff}
                            isOwner={currentIsOwner}
                            onClick={handleGenerateInvite}
                            inviteGenerated={inviteGenerated}
                        />
                        <button
                            onClick={() => {
                                if (currentIsOwner) {
                                    setShowDeleteConfirm(true);
                                } else {
                                    toast.error(t("management.delete_no_permission"));
                                }
                            }}
                            className={`w-fit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow transition
                            ${currentIsOwner
                                ? "bg-red-600 hover:bg-red-500 text-white"
                                : "bg-gray-600 cursor-not-allowed text-white/60"
                            }`}
                        >
                            <Trash2 className="w-4 h-4"/>
                            {t("management.delete_team")}
                        </button>

                        <button
                            onClick={() => toast.info(t("management.export_soon"))}
                            className="w-fit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow transition bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            <FileDown className="w-4 h-4"/>
                            {t("management.export_team")}
                        </button>

                        {showDeleteConfirm && (
                            <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
                                <div
                                    ref={deleteModalRef}
                                    className="bg-neutral-800 p-6 rounded-xl shadow-xl w-[90%] max-w-md text-left"
                                >
                                    <h3 className="text-xl font-bold mb-4 text-white">
                                        {t("management.delete_confirm_title")}
                                    </h3>
                                    <p className="text-gray-300 mb-6">
                                        {t("management.delete_confirm")}
                                    </p>
                                    <div className="flex justify-end gap-4">
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
                                        >
                                            {t("common.cancel")}
                                        </button>
                                        <button
                                            onClick={handleDeleteTeam}
                                            className="px-4 py-2 rounded bg-red-500 hover:bg-red-700 text-white"
                                        >
                                            {t("common.confirm")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}