import React, { createContext, useContext, useEffect, useState } from "react";
import { RememberService } from "../services/RememberService";

export interface AuthResponse {
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
    loading: boolean;
    logout: () => void;
    refreshUser: (steamId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const useRequiredUser = (): AuthResponse => {
    const { user, loading } = useAuth();
    if (loading) {
        throw new Error("User is still loading");
    }
    if (!user) {
        throw new Error("No authenticated user found");
    }
    return user;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async (steamId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/auth/steam/me?steamId=${steamId}`);
            if (res.ok) {
                const data: AuthResponse = await res.json();
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
        <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
