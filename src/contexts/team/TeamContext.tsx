import {
    useEffect,
    useState,
} from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/contexts/auth/useAuth";
import { getMembers, getTeam } from "@/api/endpoints/team.api";
import type { TeamDto, TeamMemberDto } from "@/api/types/team";
import type { Team, TeamMember, TeamMembership } from "@/contexts/team/team.types";
import { TeamContext } from "@/contexts/team/team.context";

/* ======================
   PROVIDER
   ====================== */

export function TeamProvider({
                                 children,
                             }: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const { teamId } = useParams<{ teamId: string }>();

    const [team, setTeam] = useState<Team | null>(null);
    const [membership, setMembership] =
        useState<TeamMembership | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!user || !teamId) {
            setIsReady(true);
            return;
        }

        let cancelled = false;

        setIsLoading(true);
        setIsReady(false);

        Promise.all([
            getTeam(teamId),
            getMembers(teamId),
        ])
            .then(([teamData, membersData]: [TeamDto, TeamMemberDto[]]) => {
                if (cancelled) return;

                setTeam({
                    id: String(teamData.id),
                    name: teamData.name,
                    logoUrl: teamData.logoUrl ?? undefined,
                });

                setMembership(
                    teamData.membership
                        ? {
                              role: teamData.membership.role,
                              isOwner: teamData.membership.isOwner,
                          }
                        : null
                );

                setMembers(
                    membersData.map((m) => ({
                        steamId: m.steamId,
                        nickname: m.nickname,
                        role: m.role,
                        isOwner: m.isOwner,
                        avatarUrl: m.avatarUrl ?? undefined,
                    }))
                );
            })
            .catch((err) => {
                console.error("Failed to load team context", err);
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                    setIsReady(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [user, teamId]);

    const resetTeam = () => {
        setTeam(null);
        setMembership(null);
        setMembers([]);
        setIsReady(false);
    };

    return (
        <TeamContext.Provider
            value={{
                team,
                membership,
                members,
                isLoading,
                isReady,
                resetTeam,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
}
