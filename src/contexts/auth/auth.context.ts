import { createContext } from "react";
import type { AuthUser } from "@/contexts/auth/auth.types.ts";

type AuthContextType = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (input: AuthUser | string) => void | Promise<void>;
    updateUser: (partial: Partial<AuthUser>) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType };

