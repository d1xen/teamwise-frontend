import {
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    const wasReadyRef = useRef(false);

    const [team, setTeam] = useState<Team | null>(null);
    const [membership, setMembership] =
        useState<TeamMembership | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState<{ status?: number | undefined } | null>(null);
    const loadIdRef = useRef(0);

    useEffect(() => {
        if (teamId) {
            appStorage.setLastTeamId(teamId);
        }
    }, [teamId]);

    const loadTeam = useCallback(async (options?: { blockUi?: boolean }) => {
        const blockUi = options?.blockUi ?? false;
        const currentLoadId = ++loadIdRef.current;

        if (!user || !teamId) {
            setIsReady(true);
            return;
        }

        // Guard: teamId must be numeric — invalid values redirect to team selection
        if (!/^\d+$/.test(teamId)) {
            navigate("/select-team", { replace: true });
            return;
        }

        setIsLoading(true);
        setLoadError(null);
        if (blockUi) {
            setIsReady(false);
        }

        try {
            const [teamData, membersData]: [TeamDto, TeamMemberDto[]] = await Promise.all([
                getTeam(teamId),
                getMembers(teamId),
            ]);
            if (loadIdRef.current !== currentLoadId) return;

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
                faceitNickname: m.faceitNickname ?? null,
                ...(m.joinedAt && { joinedAt: m.joinedAt }),
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
                ...(teamData.serverInfo && { serverInfo: teamData.serverInfo }),
                nationality: teamNationality,
            });

            const newMembership = teamData.membership
                ? { role: teamData.membership.role, isOwner: teamData.membership.isOwner, inGameRole: teamData.membership.inGameRole ?? null }
                : null;

            setMembership(newMembership);
            setMembers(convertedMembers);

            // Detect kicked: was ready (not first load) but membership is now null
            if (wasReadyRef.current && !newMembership) {
                appStorage.clearLastTeamId();
                navigate("/select-team", { replace: true });
                return;
            }
        } catch (err: unknown) {
            const status = err && typeof err === "object" && "status" in err ? (err as { status: number }).status : undefined;
            setLoadError({ status });

            // 403 while already loaded = kicked from team → redirect
            if (wasReadyRef.current && status === 403) {
                appStorage.clearLastTeamId();
                navigate("/select-team", { replace: true });
                return;
            }
            console.error("Failed to load team context", err);
        } finally {
            if (loadIdRef.current === currentLoadId) {
                setIsLoading(false);
                setIsReady(true);
                wasReadyRef.current = true;
            }
        }
    }, [user, teamId, navigate]);

    useEffect(() => {
        void loadTeam({ blockUi: true });
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
                loadError,
                resetTeam,
                refreshTeam,
                updateMemberActiveStatus,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
}
