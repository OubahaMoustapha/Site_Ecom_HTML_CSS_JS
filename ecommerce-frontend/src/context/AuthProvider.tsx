import { startTransition, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import * as authService from "../services/authService";
import { ApiRequestError, TOKEN_STORAGE_KEY } from "../services/apiClient";
import type { User } from "../types/api";
import { AuthContext, type AuthValue } from "./auth";

function readToken() {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

function writeToken(token: string | null) {
    try {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    } catch {
        // Without storage the session lasts until the page is reloaded.
    }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthValue["status"]>(() => readToken() ? "checking" : "guest");

    // Restore the session from a stored token.
    useEffect(() => {
        if (!readToken()) {
            return;
        }

        let active = true;

        authService.me()
            .then((current) => {
                if (active) {
                    setUser(current);
                    setStatus("authenticated");
                }
            })
            .catch((error: unknown) => {
                if (!active) {
                    return;
                }

                // Only a rejected token ends the session; a network error keeps it for a retry.
                if (error instanceof ApiRequestError && error.status === 401) {
                    writeToken(null);
                }

                setStatus("guest");
            });

        return () => {
            active = false;
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const result = await authService.login(email, password);
        writeToken(result.token);
        setUser(result.user);
        setStatus("authenticated");
        return result.user;
    }, []);

    const register = useCallback(async (payload: authService.RegisterPayload) => {
        const result = await authService.register(payload);
        writeToken(result.token);
        setUser(result.user);
        setStatus("authenticated");
        return result.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            // The local session is cleared even if the server call fails.
        }

        writeToken(null);
        // Leave explicitly: a guarded page would otherwise redirect with itself as
        // "from", sending the next person who logs in to the previous user's page.
        // One transition, because the router applies navigations as transitions.
        startTransition(() => {
            navigate("/login", { replace: true });
            setUser(null);
            setStatus("guest");
        });
    }, [navigate]);

    const value = useMemo(
        () => ({ user, status, login, register, logout, setUser }),
        [user, status, login, register, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
