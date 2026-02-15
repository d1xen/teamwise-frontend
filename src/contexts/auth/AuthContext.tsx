import { useCallback, useEffect, useMemo, useState } from "react";
import { getMe, type AuthResponseDto } from "@/api/endpoints/auth.api";
import { setUnauthorizedHandler } from "@/api/client/apiClient";
import appRouter from "@/router/AppRouter";
import { clearToken, getToken, setToken } from "@/shared/utils/storage/tokenStorage";
import { AuthContext } from "@/contexts/auth/auth.context";
import type { AuthUser } from "@/contexts/auth/auth.types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const doLogout = useCallback(() => {
        clearToken();
        setUser(null);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handler = () => {
            doLogout();
            appRouter.navigate("/login", { replace: true });
        };

        setUnauthorizedHandler(handler);

        return () => {
            setUnauthorizedHandler(null);
        };
    }, [doLogout]);

    useEffect(() => {
        let cancelled = false;

        const token = getToken();
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        getMe()
            .then((me: AuthResponseDto) => {
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

    const login = async (input: AuthUser | string) => {
        if (typeof input === "string") {
            setToken(input);
            try {
                const me = await getMe();
                setUser(me);
            } catch {
                clearToken();
                setUser(null);
            }
            return;
        }

        setUser(input);
    };

    const updateUser = (partial: Partial<AuthUser>) => {
        setUser((prev) => (prev ? { ...prev, ...partial } : prev));
    };

    const logout = () => {
        doLogout();
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
