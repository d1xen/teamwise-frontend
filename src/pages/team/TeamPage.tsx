import { useState } from "react";
import { useTranslation } from "react-i18next";

import Loader from "@/shared/components/Loader";
import { useTeam } from "@/contexts/team/useTeam.ts";
import { useTeamMembersSplit } from "@/features/team/hooks/useTeamMembersSplit";
import type { TeamMember } from "@/contexts/team/team.types.ts";

import MemberProfileModal from "@/features/team/components/MemberProfileModal";
import TeamProfileModal from "@/features/team/components/TeamProfileModal";

export default function TeamPage() {
    const { t } = useTranslation();
    const { team, members, isLoading } = useTeam();
    const { players, staff } = useTeamMembersSplit(members);

    const [selectedMember, setSelectedMember] =
        useState<TeamMember | null>(null);
    const [isTeamSelected, setIsTeamSelected] =
        useState(false);

    if (isLoading) {
        return <Loader />;
    }

    if (!team) {
        return (
            <div className="text-center text-gray-400 mt-16">
                {t("team.unable_to_load")}
            </div>
        );
    }

    const totalMembers = players.length + staff.length;

    return (
        <>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* ======================
                   HEADER ÉQUIPE (PRIORITAIRE)
                   ====================== */}
                <section
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsTeamSelected(true)}
                    className={`
                        flex items-center gap-6 p-8 rounded-xl cursor-pointer
                        border transition-colors
                        ${
                        isTeamSelected
                            ? "bg-neutral-800 border-indigo-500 ring-1 ring-indigo-500/40"
                            : "bg-neutral-800 border-neutral-700 hover:border-indigo-500"
                    }
                    `}
                >
                    {team.logoUrl ? (
                        <img
                            src={team.logoUrl}
                            alt={`${team.name} logo`}
                            className="w-24 h-24 object-contain rounded-md bg-neutral-900"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-md bg-neutral-700" />
                    )}

                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold text-white truncate">
                            {team.name}
                        </h1>

                        <p className="text-sm text-gray-400 mt-1">
                            {totalMembers} {t("team.members")} •{" "}
                            {staff.length} {t("team.staff")} •{" "}
                            {players.length} {t("team.players")}
                        </p>

                        <p className="text-xs text-indigo-400 mt-1">
                            {t("team.id")}: {team.id}
                        </p>
                    </div>
                </section>

                {/* ======================
                   STAFF
                   ====================== */}
                <section className="bg-neutral-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {t("team.staff")} ({staff.length})
                    </h2>

                    {staff.length === 0 ? (
                        <p className="text-gray-400">
                            {t("common.coming_soon")}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {staff.map((member) => (
                                <MemberTile
                                    key={member.steamId}
                                    member={member}
                                    selected={
                                        selectedMember?.steamId ===
                                        member.steamId
                                    }
                                    onClick={() =>
                                        setSelectedMember(member)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ======================
                   JOUEURS
                   ====================== */}
                <section className="bg-neutral-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {t("team.players")} ({players.length})
                    </h2>

                    {players.length === 0 ? (
                        <p className="text-gray-400">
                            {t("common.coming_soon")}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {players.map((member) => (
                                <MemberTile
                                    key={member.steamId}
                                    member={member}
                                    selected={
                                        selectedMember?.steamId ===
                                        member.steamId
                                    }
                                    onClick={() =>
                                        setSelectedMember(member)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* ======================
               MODALS
               ====================== */}

            {selectedMember && (
                <MemberProfileModal
                    member={selectedMember}
                    onClose={() =>
                        setSelectedMember(null)
                    }
                />
            )}

            {isTeamSelected && (
                <TeamProfileModal
                    team={team}
                    onClose={() =>
                        setIsTeamSelected(false)
                    }
                />
            )}
        </>
    );
}

/* ======================
   MEMBER TILE
   ====================== */

function MemberTile({
                        member,
                        selected,
                        onClick,
                    }: {
    member: TeamMember;
    selected: boolean;
    onClick(): void;
}) {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                w-full text-left flex items-center gap-4 p-4 rounded-lg
                border transition
                ${
                selected
                    ? "bg-neutral-800 border-indigo-500 ring-1 ring-indigo-500/40"
                    : "bg-neutral-900 border-neutral-700 hover:border-indigo-500 hover:ring-1 hover:ring-neutral-500/30"
            }
            `}
        >
            {member.avatarUrl ? (
                <img
                    src={member.avatarUrl}
                    alt={member.nickname}
                    className="w-12 h-12 rounded-full"
                />
            ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-700" />
            )}

            <div className="min-w-0 flex-1">
                <div className="font-medium text-white truncate">
                    {member.nickname}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                    {member.isOwner && (
                        <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-400 text-xs">
                            {t("team.owner")}
                        </span>
                    )}

                    {!member.isOwner && (
                        <span>{member.role}</span>
                    )}
                </div>
            </div>
        </button>
    );
}
