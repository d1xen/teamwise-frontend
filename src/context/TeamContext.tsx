// src/context/TeamContext.tsx
import { createContext, useContext, useState } from "react";

interface TeamContextType {
    teamRole: string | null;
    setTeamRole: (role: string | null) => void;
}

const TeamContext = createContext<TeamContextType>({
    teamRole: null,
    setTeamRole: () => {},
});

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
    const [teamRole, setTeamRole] = useState<string | null>(null);

    return (
        <TeamContext.Provider value={{ teamRole, setTeamRole }}>
            {children}
        </TeamContext.Provider>
    );
};

export const useTeamContext = () => useContext(TeamContext);