import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/api/api";

/* ======================
   TYPES
   ====================== */

export interface Team {
    id: string;
    name: string;
    logoUrl?: string;
}

export interface TeamMembership {
    role: string;
    isOwner: boolean;
}

export interface TeamMember {
    steamId: string;
    nickname: string;
    role: string;
    isOwner: boolean;
    avatarUrl?: string;
}

interface TeamContextType {
    team: Team | null;
    membership: TeamMembership | null;

    members: TeamMember[];
    players: TeamMember[];
    staff: TeamMember[];

    isLoading: boolean;
    isReady: boolean;

    resetTeam: () => void;
}

/* ======================
   CONTEXT
   ====================== */

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function useTeam(): TeamContextType {
    const ctx = useContext(TeamContext);
    if (!ctx) {
        throw new Error("useTeam must be used within TeamProvider");
    }
    return ctx;
}

export function useOptionalTeam() {
    const ctx = useContext(TeamContext);
    return { team: ctx?.team ?? null };
}

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
            apiFetch(`/api/teams/${teamId}`),
            apiFetch(`/api/teams/${teamId}/members`),
        ])
            .then(([teamData, membersData]) => {
                if (cancelled) return;

                setTeam({
                    id: String(teamData.id),
                    name: teamData.name,
                    logoUrl: teamData.logoUrl,
                });

                setMembership({
                    role: teamData.membership.role,
                    isOwner: teamData.membership.isOwner,
                });

                setMembers(
                    membersData.map((m: any) => ({
                        steamId: m.steamId,
                        nickname: m.nickname,
                        role: m.role,
                        isOwner: m.isOwner,
                        avatarUrl: m.avatarUrl,
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

    /* ======================
       DERIVED
       ====================== */

    const players = useMemo(
        () => members.filter((m) => m.role === "PLAYER"),
        [members]
    );

    const staff = useMemo(
        () => members.filter((m) => m.role !== "PLAYER"),
        [members]
    );

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
                players,
                staff,
                isLoading,
                isReady,
                resetTeam,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
}
