import type { ReactNode } from "react";
import { Link } from "react-router";
import { usePreferences } from "../context/preferences";
import { errorMessage } from "../lib/errors";
import Icon, { type IconName } from "./icons";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Loading({ label }: { label?: string }) {
    const { t } = usePreferences();

    return (
        <div className="state state--loading" role="status">
            <span className="spinner" aria-hidden="true" />
            <span>{label ?? t("common.loading")}</span>
        </div>
    );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
    const { t } = usePreferences();

    return (
        <div className="state state--error" role="alert">
            <Icon name="alert" size={28} />
            <p>{errorMessage(error, t("common.error"))}</p>
            {onRetry && (
                <button type="button" className="btn btn--outline" onClick={onRetry}>
                    {t("common.retry")}
                </button>
            )}
        </div>
    );
}

export function Empty({ icon = "box", title, note, action }: {
    icon?: IconName;
    title: string;
    note?: string;
    action?: ReactNode;
}) {
    return (
        <div className="state state--empty">
            <span className="state__icon"><Icon name={icon} size={32} /></span>
            <h3>{title}</h3>
            {note && <p>{note}</p>}
            {action}
        </div>
    );
}

export function NotFound() {
    const { t } = usePreferences();
    useDocumentTitle(t("common.notFound"));

    return (
        <div className="container section">
            <Empty
                icon="search"
                title={t("common.notFound")}
                action={<Link to="/" className="btn btn--primary">{t("common.backHome")}</Link>}
            />
        </div>
    );
}

/** Shows loading / error states and renders children once data is available. */
export function Async<T>({ data, error, loading, reload, children }: {
    data: T | undefined;
    error: unknown;
    loading: boolean;
    reload?: () => void;
    children: (data: T) => ReactNode;
}) {
    if (error) {
        return <ErrorView error={error} onRetry={reload} />;
    }

    if (data === undefined || (loading && data === undefined)) {
        return <Loading />;
    }

    return <>{children(data)}</>;
}
