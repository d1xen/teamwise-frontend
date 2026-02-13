import type { Team, TeamMember } from "@/contexts/TeamContext";

import InviteLinkPanel from "./InviteLinkPanel";
import TeamEditPanel from "@/pages/team/management/component/TeamEditPanel.tsx";
import MemberEditPanel from "@/pages/team/management/component/MemberEditPanel.tsx";

type Selection =
    | { type: "team" }
    | { type: "member"; member: TeamMember }
    | null;

type Props = {
    selection: Selection;
    team: Team;
    canEditTeam: boolean;
    canEditProfile(member: TeamMember): boolean;
    canEditRole(member: TeamMember): boolean;
    readOnlyLabel: string;
};

export default function SelectionPanel({
                                           selection,
                                           team,
                                           canEditTeam,
                                           canEditProfile,
                                           canEditRole,
                                           readOnlyLabel,
                                       }: Props) {
    if (!selection) return null;

    return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6 space-y-6">
            {selection.type === "team" && (
                canEditTeam ? (
                    <>
                        <TeamEditPanel team={team} />
                        <InviteLinkPanel />
                    </>
                ) : (
                    <p className="text-sm text-gray-400">
                        {readOnlyLabel}
                    </p>
                )
            )}

            {selection.type === "member" && (
                <MemberEditPanel
                    member={selection.member}
                    canEditProfile={canEditProfile(selection.member)}
                    canEditRole={canEditRole(selection.member)}
                />
            )}
        </div>
    );
}
