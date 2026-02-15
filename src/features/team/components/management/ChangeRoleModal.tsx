import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

import RoleCard from "./RoleCard";
import type { TeamMember } from "@/contexts/team/team.types.ts";
import { useTeam } from "@/contexts/team/useTeam.ts";
import { updateMemberRole } from "@/api/endpoints/team.api";

interface Props {
    member: TeamMember;
    isOpen: boolean;
    onClose(): void;
}

type RoleKey = "PLAYER" | "COACH" | "ANALYST" | "MANAGER";

export default function ChangeRoleModal({
                                            member,
                                            isOpen,
                                            onClose,
                                        }: Props) {
    const { t } = useTranslation();
    const { team } = useTeam();

    const [selectedRole, setSelectedRole] =
        useState<RoleKey>(member.role as RoleKey);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !team) return null;

    const roles: Record<
        RoleKey,
        {
            label: string;
            description: string;
            permissions: string[];
        }
    > = {
        PLAYER: {
            label: t("roles.player"),
            description: t("roles_desc.player"),
            permissions: [
                t("roles_perm.view_team"),
                t("roles_perm.edit_own_profile"),
            ],
        },
        COACH: {
            label: t("roles.coach"),
            description: t("roles_desc.coach"),
            permissions: [
                t("roles_perm.view_team"),
                t("roles_perm.edit_own_profile"),
                t("roles_perm.view_strats"),
            ],
        },
        ANALYST: {
            label: t("roles.analyst"),
            description: t("roles_desc.analyst"),
            permissions: [
                t("roles_perm.view_team"),
                t("roles_perm.view_stats"),
            ],
        },
        MANAGER: {
            label: t("roles.manager"),
            description: t("roles_desc.manager"),
            permissions: [
                t("roles_perm.edit_team"),
                t("roles_perm.edit_members"),
                t("roles_perm.edit_profiles"),
            ],
        },
    };

    /* ------------------------------------------------------------------ */
    /* Actions                                                             */
    /* ------------------------------------------------------------------ */

    const saveRole = async () => {
        if (selectedRole === member.role) {
            onClose();
            return;
        }

        setIsSaving(true);

        try {
            await updateMemberRole(team.id, member.steamId, {
                role: selectedRole,
            });

            toast.success(t("management.role_updated"));
            window.location.reload(); // MVP OK — refacto plus tard
        } catch {
            toast.error(t("common.error"));
        } finally {
            setIsSaving(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /* Render                                                              */
    /* ------------------------------------------------------------------ */

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-xl p-6 space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold">
                        {t("management.change_role")}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {t("management.change_role_for", {
                            nickname: member.nickname,
                        })}
                    </p>
                </div>

                {/* Roles */}
                <div className="space-y-3">
                    {(Object.keys(roles) as RoleKey[]).map((roleKey) => {
                        const role = roles[roleKey];

                        return (
                            <RoleCard
                                key={roleKey}
                                label={role.label}
                                description={role.description}
                                permissions={role.permissions}
                                selected={selectedRole === roleKey}
                                onSelect={() => setSelectedRole(roleKey)}
                            />
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-neutral-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                    >
                        {t("common.cancel")}
                    </button>

                    <button
                        onClick={saveRole}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {t("common.save")}
                    </button>
                </div>
            </div>
        </div>
    );
}
