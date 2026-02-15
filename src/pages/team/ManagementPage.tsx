import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/contexts/auth/useAuth";
import { useTeam } from "@/contexts/team/useTeam";
import type { TeamMember, TeamMembership } from "@/contexts/team/team.types";
import { useManagementPermissions } from "@/features/team/hooks/useManagementPermissions";
import { useTeamActions } from "@/features/team/hooks/useTeamActions";

import ManagementHeader from "@/features/team/components/management/ManagementHeader";
import TeamCard from "@/features/team/components/management/TeamCard";
import TeamEditPanel from "@/features/team/components/management/TeamEditPanel";
import InviteLinkPanel from "@/features/team/components/management/InviteLinkPanel";
import MembersGrid from "@/features/team/components/management/MembersGrid";
import MemberEditPanel from "@/features/team/components/management/MemberEditPanel";

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

    const permissions = useManagementPermissions({
        currentSteamId: user?.steamId ?? "",
        membership: membership as TeamMembership,
    });

    const { kickMember, promoteToOwner, leaveTeam } = useTeamActions({
        teamId: team?.id ?? "",
        currentUserSteamId: user?.steamId ?? "",
        isOwner: membership?.isOwner ?? false,
    });

    if (isLoading) {
        return <div className="text-gray-400">{t("common.loading")}</div>;
    }

    if (!team || !membership || !user) {
        return <div className="text-gray-400">{t("management.no_team")}</div>;
    }


    const ownerMember = members.find((m: TeamMember) => m.isOwner);
    const selectedMember =
        selection?.type === "member" ? selection.member : null;
    const isTeamSelected = selection?.type === "team";


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
                            onKick={(member) => {
                                if (!permissions.canKickMember(member)) return;
                                kickMember(member);
                            }}
                            onPromoteOwner={(member) => {
                                if (!permissions.canPromoteOwner(member)) return;
                                promoteToOwner(member);
                            }}
                            onLeaveTeam={leaveTeam}
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
