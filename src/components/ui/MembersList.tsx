import MemberRow from "./MemberRow";
import {Member} from "../../types/types.ts";

interface MemberListProps {
    members: Member[];
    roles: string[];
    currentUserSteamId: string;
    isCurrentUserStaff: boolean;
    isCurrentUserOwner: boolean;
    roleOrder: string[];
    openMenu: string | null;
    setOpenMenu: (steamId: string | null) => void;
    menuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    onMemberRoleChange: (steamId: string, newRole: string) => void;
    onOwnerToggle: (steamId: string, currentlyOwner: boolean) => void;
    onMemberRemove: (steamId: string) => void;
    onSelfLeave: () => void;
}

export default function MembersList({
                                        members,
                                        roles,
                                        currentUserSteamId,
                                        isCurrentUserStaff,
                                        isCurrentUserOwner,
                                        roleOrder,
                                        openMenu,
                                        setOpenMenu,
                                        menuRefs,
                                        onMemberRoleChange,
                                        onOwnerToggle,
                                        onMemberRemove,
                                        onSelfLeave,
                                    }: MemberListProps) {
    const getRoleIndex = (role: string) =>
        roleOrder.includes(role) ? roleOrder.indexOf(role) : roleOrder.length;

    const ownerCount = members.filter((m) => m.isOwner).length;

    const sortedMembers = [...members].sort((a, b) => {
        if (a.isOwner && !b.isOwner) return -1;
        if (!a.isOwner && b.isOwner) return 1;
        return getRoleIndex(a.role) - getRoleIndex(b.role);
    });

    return (
        <div className="space-y-3 mt-6 ml-4">
            {sortedMembers.map((member) => (
                <MemberRow
                    key={member.steamId}
                    member={member}
                    roles={roles}
                    currentUserSteamId={currentUserSteamId}
                    isCurrentUserStaff={isCurrentUserStaff}
                    isCurrentUserOwner={isCurrentUserOwner}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    menuRefs={menuRefs}
                    onMemberRoleChange={onMemberRoleChange}
                    onOwnerToggle={onOwnerToggle}
                    onMemberRemove={onMemberRemove}
                    onSelfLeave={onSelfLeave}
                    hasOtherOwners={ownerCount > 1}
                />
            ))}
        </div>
    );
}
