import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { TeamMember } from "@/contexts/TeamContext";
import ChangeRoleModal from "./ChangeRoleModal";

type Props = {
    member: TeamMember;
    selected: boolean;
    hasAnyAction: boolean;
    canKick: boolean;
    canPromoteOwner: boolean;
    canLeaveTeam: boolean;
    canEditRole: boolean;
    onSelect(): void;
    onKick(): void;
    onPromoteOwner(): void;
    onLeaveTeam(): void;
    openMenu: boolean;
    onToggleMenu(): void;
};

export default function MemberCard({
                                       member,
                                       selected,
                                       hasAnyAction,
                                       canKick,
                                       canPromoteOwner,
                                       canLeaveTeam,
                                       canEditRole,
                                       onSelect,
                                       onKick,
                                       onPromoteOwner,
                                       onLeaveTeam,
                                       openMenu,
                                       onToggleMenu,
                                   }: Props) {
    const { t } = useTranslation();
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

    return (
        <>
            <div
                onClick={onSelect}
                className={[
                    "relative rounded-lg p-4 border cursor-pointer transition",
                    selected
                        ? "bg-indigo-600/20 border-indigo-500"
                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-600",
                ].join(" ")}
            >
                {/* Menu ⋮ */}
                {hasAnyAction && (
                    <div className="absolute top-2 right-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMenu();
                            }}
                            className="w-7 h-7 rounded-full hover:bg-neutral-700 flex items-center justify-center"
                        >
                            ⋮
                        </button>

                        {openMenu && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md bg-neutral-900 border border-neutral-700 shadow-lg z-50">
                                {canEditRole && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsRoleModalOpen(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800"
                                    >
                                        {t("management.change_role")}
                                    </button>
                                )}

                                {canPromoteOwner && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPromoteOwner();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 text-yellow-400"
                                    >
                                        {t("management.promote_owner")}
                                    </button>
                                )}

                                {canKick && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onKick();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 text-red-400"
                                    >
                                        {t("management.kick_member")}
                                    </button>
                                )}

                                {canLeaveTeam && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLeaveTeam();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 text-orange-400"
                                    >
                                        {t("management.leave_team")}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Card content */}
                <div className="flex items-center gap-4">
                    {member.avatarUrl ? (
                        <img
                            src={member.avatarUrl}
                            alt={member.nickname}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-neutral-700" />
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                            {member.nickname}
                        </div>
                        <div className="text-sm text-gray-400">
                            {t(`roles.${member.role.toLowerCase()}`)}
                            {member.isOwner && ` • ${t("roles.owner")}`}
                        </div>
                    </div>
                </div>
            </div>

            {/* Change role modal */}
            <ChangeRoleModal
                member={member}
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
            />
        </>
    );
}
