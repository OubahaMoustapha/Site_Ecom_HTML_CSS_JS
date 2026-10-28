import { createContext, useContext } from "react";
import type { RegisterPayload } from "../services/authService";
import type { User } from "../types/api";

export interface AuthValue {
    user: User | null;
    status: "checking" | "guest" | "authenticated";
    login: (email: string, password: string) => Promise<User>;
    register: (payload: RegisterPayload) => Promise<User>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth() {
    const value = useContext(AuthContext);

    if (!value) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return value;
}
