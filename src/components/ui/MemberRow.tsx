import { User, X, ArrowUp, ArrowDown } from "lucide-react";
import { Member } from "../../types/types.ts";
import { useTranslation } from "react-i18next";

interface MemberRowProps {
    member: Member;
    roles: string[];
    currentUserSteamId: string;
    isCurrentUserStaff: boolean;
    isCurrentUserOwner: boolean;
    openMenu: string | null;
    setOpenMenu: (steamId: string | null) => void;
    menuRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    onMemberRoleChange: (steamId: string, newRole: string) => void;
    onOwnerToggle: (steamId: string, currentlyOwner: boolean) => void;
    onMemberRemove: (steamId: string) => void;
    onSelfLeave: () => void;
    hasOtherOwners: boolean;
}

export default function MemberRow({
                                      member,
                                      roles,
                                      currentUserSteamId,
                                      isCurrentUserStaff,
                                      isCurrentUserOwner,
                                      openMenu,
                                      setOpenMenu,
                                      menuRefs,
                                      onMemberRoleChange,
                                      onOwnerToggle,
                                      onMemberRemove,
                                      onSelfLeave,
                                      hasOtherOwners,
                                  }: MemberRowProps) {
    const { t } = useTranslation();
    const isMe = member.steamId === currentUserSteamId;
    const canToggleOwner = isCurrentUserOwner && (!isMe || hasOtherOwners);
    const canChangeRole = isCurrentUserOwner || isCurrentUserStaff;
    const canRemoveMember = isCurrentUserStaff || isCurrentUserOwner;

    const handleMenuAction = (action: () => void) => {
        action();
        setOpenMenu(null);
    };

    return (
        <div className="bg-neutral-800 rounded-md px-4 py-3 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
                <img src={member.avatarUrl} alt={member.nickname} className="w-9 h-9 rounded-full" />
                <span className="text-white text-base font-medium flex items-center gap-2">
                    {member.customUsername || member.nickname}
                    {member.isOwner && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 2.5-7.5L2 9h7l3-7z"/>
                        </svg>
                    )}
                    {isMe && <User className="w-5 h-5 text-blue-500 stroke-2" />}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-full max-w-xs">
                    <select
                        disabled={!canChangeRole}
                        value={member.role}
                        onChange={(e) => {
                            const newRole = e.target.value;
                            if (member.role !== newRole) {
                                onMemberRoleChange(member.steamId, newRole);
                            }
                        }}
                        className="bg-neutral-700 text-sm text-white w-full px-3 py-2 pr-10 rounded-md border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 appearance-none transition"
                    >
                        {[...new Set(roles)].map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}
                             viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === member.steamId ? null : member.steamId);
                        }}
                        className="text-white hover:text-gray-300 px-2"
                        title={t("member.options")}
                    >
                        ⋮
                    </button>

                    {openMenu === member.steamId && (
                        <div
                            ref={(el) => {
                                menuRefs.current[member.steamId] = el;
                            }}
                            className="absolute right-0 top-8 z-10 bg-neutral-800 border border-neutral-600 rounded-xl shadow-lg px-3 py-2 min-w-[240px] space-y-1"
                        >
                            {isMe ? (
                                <>
                                    {member.isOwner && hasOtherOwners && (
                                        <button
                                            onClick={() => handleMenuAction(() => onOwnerToggle(member.steamId, true))}
                                            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 hover:bg-neutral-700 w-full text-left px-3 py-2 rounded text-sm"
                                        >
                                            <ArrowDown className="w-4 h-4 text-white" /> {t("member.remove_owner")}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleMenuAction(onSelfLeave)}
                                        className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-neutral-700 w-full text-left px-3 py-2 rounded text-sm"
                                    >
                                        <X className="w-4 h-4 text-red-500" /> {t("member.leave_team")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {canToggleOwner && (
                                        <button
                                            onClick={() =>
                                                handleMenuAction(() => onOwnerToggle(member.steamId, member.isOwner))
                                            }
                                            className="flex items-center gap-2 text-white hover:text-gray-200 hover:bg-neutral-700 w-full text-left px-3 py-2 rounded text-sm"
                                        >
                                            {member.isOwner ? (
                                                <ArrowDown className="w-4 h-4 text-white" />
                                            ) : (
                                                <ArrowUp className="w-4 h-4 text-white" />
                                            )}
                                            {member.isOwner
                                                ? t("member.remove_owner")
                                                : t("member.promote_owner")}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (!canRemoveMember) return;
                                            handleMenuAction(() => onMemberRemove(member.steamId));
                                        }}
                                        disabled={!canRemoveMember}
                                        className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded text-sm ${
                                            canRemoveMember
                                                ? "text-red-400 hover:text-red-300 hover:bg-neutral-700"
                                                : "text-gray-500 cursor-not-allowed"
                                        }`}
                                    >
                                        <X className="w-4 h-4 text-red-500" />{" "}
                                        {t("member.kick", { name: member.customUsername || member.nickname })}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
