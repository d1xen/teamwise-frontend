import {
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/contexts/auth/useAuth";
import { getMembers, getTeam } from "@/api/endpoints/team.api";
import type { TeamDto, TeamMemberDto } from "@/api/types/team";
import type { Team, TeamMember, TeamMembership } from "@/contexts/team/team.types";
import { TeamContext } from "@/contexts/team/team.context";
import { appStorage } from "@/shared/utils/storage/appStorage";
import { calculateTeamNationality } from "@/shared/utils/countryUtils";

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
    const isCancelledRef = useRef(false);

    useEffect(() => {
        if (teamId) {
            appStorage.setLastTeamId(teamId);
        }
    }, [teamId]);

    const loadTeam = useCallback(async (options?: { blockUi?: boolean }) => {
        const blockUi = options?.blockUi ?? false;

        if (!user || !teamId) {
            setIsReady(true);
            return;
        }

        setIsLoading(true);
        if (blockUi) {
            setIsReady(false);
        }

        try {
            const [teamData, membersData]: [TeamDto, TeamMemberDto[]] = await Promise.all([
                getTeam(teamId),
                getMembers(teamId),
            ]);
            if (isCancelledRef.current) return;

            // Convertir les données des membres
            const convertedMembers = membersData.map((m) => ({
                steamId: m.steamId,
                nickname: m.nickname,
                role: m.role,
                isOwner: m.isOwner,
                ...(m.avatarUrl && { avatarUrl: m.avatarUrl }),
                ...(m.profileImageUrl && { profileImageUrl: m.profileImageUrl }),
                ...(m.profileCompleted !== undefined ? { profileCompleted: m.profileCompleted } : {}),
                ...(m.discord && { discord: m.discord }),
                ...(m.twitter && { twitter: m.twitter }),
                ...(m.inGameRole && { inGameRole: m.inGameRole }),
                ...(m.activePlayer !== undefined ? { activePlayer: m.activePlayer } : {}),
                ...(m.links && { links: m.links }),
                ...(m.firstName && { firstName: m.firstName }),
                ...(m.lastName && { lastName: m.lastName }),
                ...(m.birthDate && { birthDate: m.birthDate }),
                ...(m.countryCode && { countryCode: m.countryCode }),
                ...(m.customUsername && { customUsername: m.customUsername }),
            }));

            // Calculer la nationalité de l'équipe basée sur les joueurs
            const teamNationality = calculateTeamNationality(convertedMembers);

            setTeam({
                id: String(teamData.id),
                name: teamData.name,
                ...(teamData.logoUrl && { logoUrl: teamData.logoUrl }),
                ...(teamData.tag && { tag: teamData.tag }),
                ...(teamData.game && { game: teamData.game }),
                ...(teamData.links && { links: teamData.links }),
                ...(teamData.membersOverview && { membersOverview: teamData.membersOverview }),
                // Nouveaux champs enrichis depuis backend
                ...(teamData.createdAt && { createdAt: teamData.createdAt }),
                ...(teamData.updatedAt && { updatedAt: teamData.updatedAt }),
                ...(teamData.description && { description: teamData.description }),
                // Nationalité calculée
                nationality: teamNationality,
            });

            setMembership(
                teamData.membership
                    ? {
                          role: teamData.membership.role,
                          isOwner: teamData.membership.isOwner,
                      }
                    : null
            );

            setMembers(convertedMembers);
        } catch (err) {
            console.error("Failed to load team context", err);
        } finally {
            if (!isCancelledRef.current) {
                setIsLoading(false);
                setIsReady(true);
            }
        }
    }, [user, teamId]);

    useEffect(() => {
        isCancelledRef.current = false;
        void loadTeam({ blockUi: true });
        return () => {
            isCancelledRef.current = true;
        };
    }, [loadTeam]);

    const resetTeam = () => {
        setTeam(null);
        setMembership(null);
        setMembers([]);
        setIsReady(false);
    };

    const refreshTeam = async () => {
        await loadTeam({ blockUi: false });
    };

    // Mise à jour locale du statut actif d'un joueur (optimistic update)
    const updateMemberActiveStatus = (steamId: string, activePlayer: boolean) => {
        // Mettre à jour les membres localement
        const updatedMembers = members.map((m) =>
            m.steamId === steamId ? { ...m, activePlayer } : m
        );

        setMembers(updatedMembers);

        // Recalculer la nationalité avec les membres mis à jour
        const teamNationality = calculateTeamNationality(updatedMembers);

        // Mettre à jour la nationalité de l'équipe
        setTeam((prevTeam) => {
            if (!prevTeam) return prevTeam;
            return {
                ...prevTeam,
                nationality: teamNationality,
            };
        });
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
                refreshTeam,
                updateMemberActiveStatus,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
}
