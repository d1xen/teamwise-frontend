import { createContext, useCallback, useContext, useState } from "react";

export interface TeamMembership {
    role: string;
    isOwner: boolean;
}

interface TeamContextType {
    memberships: Record<string, TeamMembership>;
    setInitialMembership: (teamId: string, data: TeamMembership) => void;
    getMembership: (teamId: string) => TeamMembership | null;
    getRole: (teamId: string) => string | null;
    isOwner: (teamId: string) => boolean;
    loadMembership: (teamId: string, steamId: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
    memberships: {},
    setInitialMembership: () => {},
    getMembership: () => null,
    getRole: () => null,
    isOwner: () => false,
    loadMembership: async () => {},
});

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
    const [memberships, setMemberships] = useState<Record<string, TeamMembership>>({});

    const setInitialMembership = (teamId: string, data: TeamMembership) => {
        setMemberships((prev) => {
            if (prev[teamId]) return prev;
            return { ...prev, [teamId]: data };
        });
    };

    const getMembership = (teamId: string) => {
        return memberships[teamId] || null;
    };

    const getRole = (teamId: string) => {
        return memberships[teamId]?.role || null;
    };

    const isOwner = (teamId: string) => {
        return memberships[teamId]?.isOwner === true;
    };

    const loadMembership = useCallback(async (teamId: string, steamId: string) => {
        if (memberships[teamId]) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/membership?steamId=${steamId}`);
            if (!res.ok) throw new Error("Failed to fetch membership");
            const data = await res.json();
            setInitialMembership(teamId, data);
        } catch (error) {
            console.error("Erreur lors du chargement du membership", error);
        }
    }, [memberships]);

    return (
        <TeamContext.Provider
            value={{
                memberships,
                setInitialMembership,
                getMembership,
                getRole,
                isOwner,
                loadMembership,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
};

export const useTeamContext = () => useContext(TeamContext);
