import { createContext, useContext, useState } from "react";

export interface TeamMembership {
    steamId: string;
    role: string;
    isOwner: boolean;
}

interface TeamContextType {
    memberships: Record<string, TeamMembership>;
    isLoading: boolean;
    getMembership: (teamId: string) => TeamMembership | null;
    getRole: (teamId: string) => string | null;
    isOwner: (teamId: string) => boolean;
    loadMembership: (teamId: string, steamId: string, force?: boolean) => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
    memberships: {},
    isLoading: false,
    getMembership: () => null,
    getRole: () => null,
    isOwner: () => false,
    loadMembership: async () => {},
});

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
    const [memberships, setMemberships] = useState<Record<string, TeamMembership>>({});
    const [isLoading, setIsLoading] = useState(false);

    const getMembership = (teamId: string) => memberships[teamId] || null;
    const getRole = (teamId: string) => memberships[teamId]?.role || null;
    const isOwner = (teamId: string) => memberships[teamId]?.isOwner || false;

    const loadMembership = async (teamId: string, steamId: string, force = false) => {
        if (!force && memberships[teamId]) return;
        try {
            setIsLoading(true);
            const res = await fetch(`/api/teams/${teamId}/membership?steamId=${steamId}`);
            if (!res.ok) throw new Error("Failed to fetch membership");

            const data = await res.json();
            const mapped: TeamMembership = {
                steamId: data.steamId,
                role: data.role,
                isOwner: data.owner === true,
            };

            setMemberships(prev => ({ ...prev, [teamId]: mapped }));
        } catch (err) {
            console.error("Erreur lors du chargement du membership :", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TeamContext.Provider
            value={{ memberships, isLoading, getMembership, getRole, isOwner, loadMembership }}
        >
            {children}
        </TeamContext.Provider>
    );
};

export const useTeamContext = () => useContext(TeamContext);
