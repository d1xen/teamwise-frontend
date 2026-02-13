import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { useTeam, TeamMember, TeamMembership } from "@/contexts/TeamContext";
import { useManagementPermissions } from "@/pages/team/management/hook/useManagementPermissions";

import ManagementHeader from "@/pages/team/management/component/ManagementHeader";
import TeamCard from "@/pages/team/management/component/TeamCard";
import TeamEditPanel from "@/pages/team/management/component/TeamEditPanel";
import InviteLinkPanel from "@/pages/team/management/component/InviteLinkPanel";
import MembersGrid from "@/pages/team/management/component/MembersGrid";
import MemberEditPanel from "@/pages/team/management/component/MemberEditPanel";

type Tab = "team" | "members";
type Selection =
    | { type: "team" }
    | { type: "member"; member: TeamMember }
    | null;

export default function ManagementPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { team, membership, members, isLoading } = useTeam();

    const [activeTab, setActiveTab] = useState<Tab>("team");
    const [selection, setSelection] = useState<Selection>(null);

    if (isLoading) {
        return <div className="text-gray-400">{t("common.loading")}</div>;
    }

    if (!team || !membership || !user) {
        return <div className="text-gray-400">{t("management.no_team")}</div>;
    }

    const permissions = useManagementPermissions({
        currentSteamId: user.steamId,
        membership: membership as TeamMembership,
    });

    const ownerMember = members.find((m) => m.isOwner);
    const selectedMember =
        selection?.type === "member" ? selection.member : null;
    const isTeamSelected = selection?.type === "team";

    /* ======================
       ACTIONS MEMBRES
       ====================== */

    const handleKick = async (member: TeamMember) => {
        if (!permissions.canKickMember(member)) return;

        const confirmed = window.confirm(
            t("management.confirm_kick", { nickname: member.nickname })
        );
        if (!confirmed) return;

        try {
            const res = await fetch(
                `/api/teams/${team.id}/members/${member.steamId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error();
            toast.success(t("management.member_kicked"));
        } catch {
            toast.error(t("common.error"));
        }
    };

    const handlePromoteOwner = async (member: TeamMember) => {
        if (!permissions.canPromoteOwner(member)) return;

        const confirmed = window.confirm(
            t("management.confirm_transfer_owner", {
                nickname: member.nickname,
            })
        );
        if (!confirmed) return;

        try {
            const res = await fetch(
                `/api/teams/${team.id}/owner/${member.steamId}`,
                { method: "PUT" }
            );
            if (!res.ok) throw new Error();
            toast.success(t("management.owner_transferred"));
        } catch {
            toast.error(t("common.error"));
        }
    };

    const handleLeaveTeam = async () => {
        if (membership.isOwner) {
            toast.error(t("management.owner_must_transfer"));
            return;
        }

        const confirmed = window.confirm(t("management.confirm_leave"));
        if (!confirmed) return;

        try {
            const res = await fetch(
                `/api/teams/${team.id}/members/${user.steamId}`,
                { method: "DELETE" }
            );
            if (!res.ok) throw new Error();
            window.location.href = "/select-team";
        } catch {
            toast.error(t("common.error"));
        }
    };

    /* ======================
       RENDER
       ====================== */

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <ManagementHeader
                title={t("management.title")}
                subtitle={t("management.subtitle")}
                roleLabel={t(`roles.${membership.role.toLowerCase()}`)}
                isOwner={membership.isOwner}
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-neutral-700">
                <TabButton
                    active={activeTab === "team"}
                    label={t("management.tab_team")}
                    onClick={() => {
                        setActiveTab("team");
                        setSelection(null);
                    }}
                />
                <TabButton
                    active={activeTab === "members"}
                    label={t("management.tab_members")}
                    onClick={() => {
                        setActiveTab("members");
                        setSelection(null);
                    }}
                />
            </div>

            {/* TEAM TAB */}
            {activeTab === "team" && (
                <div className="space-y-6">
                    <TeamCard
                        team={team}
                        ownerNickname={ownerMember?.nickname}
                        selected={isTeamSelected}
                        onSelect={() => {
                            if (!permissions.canEditTeam()) return;
                            setSelection(
                                isTeamSelected ? null : { type: "team" }
                            );
                        }}
                    />

                    {isTeamSelected && permissions.canEditTeam() && (
                        <>
                            <TeamEditPanel team={team} />
                            <InviteLinkPanel />
                        </>
                    )}

                    {!permissions.canEditTeam() && (
                        <p className="text-sm text-gray-400">
                            {t("management.read_only")}
                        </p>
                    )}
                </div>
            )}

            {/* MEMBERS TAB */}
            {activeTab === "members" && (
                <>
                    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                        <MembersGrid
                            members={members}
                            selectedMember={selectedMember}
                            permissions={permissions}
                            onSelect={(member) =>
                                setSelection({ type: "member", member })
                            }
                            onKick={handleKick}
                            onPromoteOwner={handlePromoteOwner}
                            onLeaveTeam={handleLeaveTeam}
                        />
                    </div>

                    {selectedMember && (
                        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
                            <MemberEditPanel
                                member={selectedMember}
                                canEditProfile={permissions.canEditMemberProfile(
                                    selectedMember
                                )}
                                canEditRole={permissions.canEditMemberRole(
                                    selectedMember
                                )}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ======================
   UI
   ====================== */

function TabButton({
                       active,
                       label,
                       onClick,
                   }: {
    active: boolean;
    label: string;
    onClick(): void;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                active
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
        >
            {label}
        </button>
    );
}
