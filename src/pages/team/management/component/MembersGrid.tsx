import { useState } from "react";
import type { TeamMember } from "@/contexts/TeamContext";
import MemberCard from "./MemberCard";

type Permissions = {
    hasAnyAction(member: TeamMember): boolean;
    canKickMember(member: TeamMember): boolean;
    canPromoteOwner(member: TeamMember): boolean;
    canLeaveTeam(member: TeamMember): boolean;
};

type Props = {
    members: TeamMember[];
    selectedMember: TeamMember | null;
    permissions: Permissions;
    onSelect(member: TeamMember): void;
    onKick(member: TeamMember): void;
    onPromoteOwner(member: TeamMember): void;
    onLeaveTeam(): void;
};

export default function MembersGrid({
                                        members,
                                        selectedMember,
                                        permissions,
                                        onSelect,
                                        onKick,
                                        onPromoteOwner,
                                        onLeaveTeam,
                                    }: Props) {
    const [openMenuSteamId, setOpenMenuSteamId] =
        useState<string | null>(null);

    if (members.length === 0) {
        return (
            <p className="text-sm text-gray-400">
                No members found.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
                const isSelected =
                    selectedMember?.steamId === member.steamId;

                return (
                    <MemberCard
                        key={member.steamId}
                        member={member}
                        selected={isSelected}
                        hasAnyAction={permissions.hasAnyAction(member)}
                        canKick={permissions.canKickMember(member)}
                        canPromoteOwner={permissions.canPromoteOwner(member)}
                        canLeaveTeam={permissions.canLeaveTeam(member)}
                        onSelect={() => onSelect(member)}
                        onKick={() => onKick(member)}
                        onPromoteOwner={() => onPromoteOwner(member)}
                        onLeaveTeam={onLeaveTeam}
                        openMenu={openMenuSteamId === member.steamId}
                        onToggleMenu={() =>
                            setOpenMenuSteamId((prev) =>
                                prev === member.steamId
                                    ? null
                                    : member.steamId
                            )
                        }
                    />
                );
            })}
        </div>
    );
}
