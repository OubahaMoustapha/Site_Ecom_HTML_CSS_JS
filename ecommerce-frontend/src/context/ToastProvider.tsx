import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastTone } from "./toast";

interface Toast {
    id: number;
    message: string;
    tone: ToastTone;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(1);

    const notify = useCallback((message: string, tone: ToastTone = "success") => {
        const id = nextId.current++;

        setToasts((current) => [...current.slice(-2), { id, message, tone }]);

        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3500);
    }, []);

    const value = useMemo(() => ({ notify }), [notify]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="toasts" role="status" aria-live="polite">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast--${toast.tone}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
