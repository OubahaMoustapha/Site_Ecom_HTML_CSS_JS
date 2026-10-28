import apiClient from "./apiClient";
import type { AuthResult, User, Wrapped } from "../types/api";

const DEVICE_NAME = "web";

export async function login(email: string, password: string) {
    const response = await apiClient<Wrapped<AuthResult>>({
        endpoint: "/auth/login",
        method: "POST",
        body: { email, password, device_name: DEVICE_NAME },
    });
    return response.data;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export async function register(payload: RegisterPayload) {
    const response = await apiClient<Wrapped<AuthResult>>({
        endpoint: "/auth/register",
        method: "POST",
        body: { ...payload, device_name: DEVICE_NAME },
    });
    return response.data;
}

export async function me() {
    const response = await apiClient<Wrapped<User>>({ endpoint: "/auth/me" });
    return response.data;
}

export function logout() {
    return apiClient<Wrapped<null>>({ endpoint: "/auth/logout", method: "POST" });
}

export async function updateProfile(name: string, email: string) {
    const response = await apiClient<Wrapped<User>>({
        endpoint: "/auth/profile",
        method: "PUT",
        body: { name, email },
    });
    return response.data;
}

export function changePassword(current_password: string, password: string, password_confirmation: string) {
    return apiClient<Wrapped<null>>({
        endpoint: "/auth/change-password",
        method: "PUT",
        body: { current_password, password, password_confirmation },
    });
}

export function forgotPassword(email: string) {
    return apiClient<Wrapped<null>>({
        endpoint: "/auth/forgot-password",
        method: "POST",
        body: { email },
    });
}

export function resetPassword(token: string, email: string, password: string, password_confirmation: string) {
    return apiClient<Wrapped<null>>({
        endpoint: "/auth/reset-password",
        method: "POST",
        body: { token, email, password, password_confirmation },
    });
}

export function resendVerification() {
    return apiClient<Wrapped<null>>({ endpoint: "/auth/email/resend", method: "POST" });
}
