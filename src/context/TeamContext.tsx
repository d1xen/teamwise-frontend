// src/context/TeamContext.tsx
import { createContext, useContext, useState } from "react";

interface TeamContextType {
    teamRole: string | null;
    setTeamRole: (role: string | null) => void;
    isOwner: boolean;
    setIsOwner: (isOwner: boolean) => void;
}

const TeamContext = createContext<TeamContextType>({
    teamRole: null,
    setTeamRole: () => {},
    isOwner: false,
    setIsOwner: () => {},
});

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
    const [teamRole, setTeamRole] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState<boolean>(false);

    return (
        <TeamContext.Provider value={{ teamRole, setTeamRole, isOwner, setIsOwner }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeamContext = () => useContext(TeamContext);
