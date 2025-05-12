import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Users} from "lucide-react";
import { useRequiredUser } from "../../context/AuthContext.tsx";
import { useTeamAccessGuard } from "../../hook/useTeamAccessGuard.ts";
import { limitedToast as toast } from "../../utils/limitedToast.ts";
import TeamTabs from "../../components/ui/TeamTabs.tsx";
import GenerateInviteButton from "../../components/ui/GenerateInviteButton.tsx";
import MembersList from "../../components/ui/MembersList.tsx";
import { useTranslation } from "react-i18next";
import Loader from "../../components/ui/Loader.tsx";
import { useTeamContext } from "../../context/TeamContext.tsx";
import {TeamEditForm} from "../../components/layout/TeamEditForm.tsx";
import {useTeamId} from "../../hook/useTeamId.ts";
import ExportTeamButton from "../../components/ui/ExportTeamButton.tsx";
import DeleteTeamButton from "../../components/ui/DeleteTeamButton.tsx";
import DeleteTeamModal from "../../components/ui/DeleteTeamModal.tsx";

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
    const teamId = useTeamId();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { getMembership, loadMembership, isLoading } = useTeamContext();
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("MEMBRES");
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
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

                        <TeamEditForm
                            isStaff={isCurrentUserStaff}
                            isOwner={currentIsOwner}
                            teamId={teamId}
                            onSuccess={() => navigate(`/app/team/${teamId}/profile`)}
                        />
                        <GenerateInviteButton
                            teamId={teamId}
                            isStaff={isCurrentUserStaff}
                            isOwner={currentIsOwner}
                        />
                        <ExportTeamButton />
                        <DeleteTeamButton
                            isOwner={currentIsOwner}
                            onClick={() => setShowDeleteConfirm(true)}
                        />
                        <DeleteTeamModal
                            isOpen={showDeleteConfirm}
                            teamId={teamId}
                            onClose={() => setShowDeleteConfirm(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}