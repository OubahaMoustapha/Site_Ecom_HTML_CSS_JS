import { createContext, useContext } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastValue {
    notify: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastValue | null>(null);

export function useToast() {
    const value = useContext(ToastContext);

    if (!value) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return value;
}
