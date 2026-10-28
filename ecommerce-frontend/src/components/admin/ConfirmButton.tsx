import { useState, type ReactNode } from "react";
import { usePreferences } from "../../context/preferences";

interface Props {
    /** Question shown before acting, e.g. "Delete this product?". */
    question: string;
    onConfirm: () => Promise<unknown> | void;
    className?: string;
    disabled?: boolean;
    children: ReactNode;
}

/**
 * A destructive action that asks inline before running (no browser dialog),
 * and stays disabled while the request is in flight.
 */
export default function ConfirmButton({ question, onConfirm, className = "btn btn--danger btn--sm", disabled, children }: Props) {
    const { t } = usePreferences();
    const [asking, setAsking] = useState(false);
    const [busy, setBusy] = useState(false);

    if (!asking) {
        return (
            <button type="button" className={className} disabled={disabled} onClick={() => setAsking(true)}>
                {children}
            </button>
        );
    }

    const confirm = async () => {
        setBusy(true);

        try {
            await onConfirm();
        } finally {
            setBusy(false);
            setAsking(false);
        }
    };

    return (
        <span className="confirm" role="group" aria-label={question}>
            <span className="confirm__question">{question}</span>
            <button type="button" className="btn btn--danger btn--sm" onClick={confirm} disabled={busy} aria-busy={busy} autoFocus>
                {t("common.confirm")}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAsking(false)} disabled={busy}>
                {t("common.cancel")}
            </button>
        </span>
    );
}
