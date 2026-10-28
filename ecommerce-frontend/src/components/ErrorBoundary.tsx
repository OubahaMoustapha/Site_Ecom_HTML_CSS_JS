import { Component, type ContextType, type ReactNode } from "react";
import { PreferencesContext } from "../context/preferences";
import Icon from "./icons";

interface State {
    error: Error | null;
}

/** Last line of defence: a crash in any page shows a reload screen instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
    static contextType = PreferencesContext;
    declare context: ContextType<typeof PreferencesContext>;

    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error(error);
    }

    render() {
        if (!this.state.error) {
            return this.props.children;
        }

        const t = this.context?.t;

        return (
            <div className="container section">
                <div className="state state--error" role="alert">
                    <Icon name="alert" size={32} />
                    <h1>{t ? t("app.crash.title") : "Something unexpected happened"}</h1>
                    <p>{t ? t("app.crash.note") : "Reload the page."}</p>
                    <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
                        {t ? t("app.crash.reload") : "Reload"}
                    </button>
                </div>
            </div>
        );
    }
}
