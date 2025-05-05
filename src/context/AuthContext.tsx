import { createContext, useContext, useEffect, useState } from "react";
import { RememberService } from "../services/RememberService";

interface AuthResponse {
    steamId: string;
    nickname: string;
    avatarUrl: string;
    hasTeam: boolean;
    teamId: number | null;
    customUsername?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

interface AuthContextProps {
    user: AuthResponse | null;
    logout: () => void;
    refreshUser: (steamId: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    logout: () => {},
    refreshUser: async () => {},
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async (steamId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/auth/steam/me?steamId=${steamId}`);
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                throw new Error("Failed to fetch user");
            }
        } catch (err) {
            console.error("Erreur lors du refresh user", err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const steamId = RememberService.load();
        if (!steamId) {
            setLoading(false);
            return;
        }

        refreshUser(steamId);
    }, []);

    const logout = () => {
        localStorage.removeItem("steamId");
        RememberService.clear();
        setUser(null);
        window.location.href = "/landing";
    };

    return (
        <AuthContext.Provider value={{ user, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
