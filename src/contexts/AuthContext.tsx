import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/api/api";

export interface AuthUser {
    steamId: string;
    nickname: string;
    avatarUrl: string | null;
    hasTeam: boolean;
    profileCompleted: boolean;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (user: AuthUser) => void;
    updateUser: (partial: Partial<AuthUser>) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        apiFetch("/api/auth/me")
            .then((me) => {
                if (!cancelled) {
                    setUser(me);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setUser(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const login = (user: AuthUser) => {
        setUser(user);
    };

    const updateUser = (partial: Partial<AuthUser>) => {
        setUser((prev) => (prev ? { ...prev, ...partial } : prev));
    };

    const logout = () => {
        localStorage.removeItem("jwt");
        setUser(null);
    };

    const isAuthenticated = useMemo(() => user !== null, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                updateUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
