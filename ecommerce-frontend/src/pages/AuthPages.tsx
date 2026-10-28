import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import Field from "../components/Field";
import { LogoMark } from "../components/Logo";
import { useAuth } from "../context/auth";
import { usePreferences } from "../context/preferences";
import { errorMessage, fieldErrors } from "../lib/errors";
import * as authService from "../services/authService";
import type { User } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

function AuthShell({ title, note, children, footer }: {
    title: string;
    note?: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <section className="container section auth">
            <div className="auth__card">
                <LogoMark size={48} />
                <h1 className="auth__title">{title}</h1>
                {note && <p className="muted">{note}</p>}
                {children}
                {footer && <div className="auth__footer">{footer}</div>}
            </div>
        </section>
    );
}

/** Shared submit handling: busy flag, field errors and a general error line. */
function useSubmit() {
    const { t } = usePreferences();
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);

    const run = async (action: () => Promise<void>) => {
        if (busy) {
            return;
        }

        setBusy(true);
        setErrors({});
        setMessage(null);

        try {
            await action();
        } catch (error) {
            setErrors(fieldErrors(error));
            setMessage(errorMessage(error, t("common.error"), t("auth.tooMany")));
        } finally {
            setBusy(false);
        }
    };

    return { busy, errors, message, run };
}

// The page a signed-in user lands on: where they came from, else their home area.
// Used by both the post-submit navigation and the "already signed in" redirect,
// which renders first, so the two must agree.
function redirectTarget(state: unknown, user: User) {
    const from = (state as { from?: string } | null)?.from;

    if (from && from.startsWith("/") && !from.startsWith("/login")) {
        return from;
    }

    return user.role === "admin" ? "/admin" : "/account";
}

export function LoginPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("auth.login"));
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { busy, errors, message, run } = useSubmit();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    if (user) {
        return <Navigate to={redirectTarget(location.state, user)} replace />;
    }

    const submit = (event: FormEvent) => {
        event.preventDefault();
        void run(async () => {
            const loggedIn = await login(email, password);
            navigate(redirectTarget(location.state, loggedIn), { replace: true });
        });
    };

    return (
        <AuthShell
            title={t("auth.welcomeBack")}
            footer={<>{t("auth.noAccount")} <Link to="/register" state={location.state}>{t("auth.register")}</Link></>}
        >
            <form className="stack" onSubmit={submit} noValidate>
                <Field label={t("auth.email")} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} required />
                <Field label={t("auth.password")} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} required />
                {message && !errors.email && <p className="form-error" role="alert">{message}</p>}
                <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>{t("auth.login")}</button>
                <Link to="/forgot-password" className="link-btn">{t("auth.forgot")}</Link>
            </form>
        </AuthShell>
    );
}

export function RegisterPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("auth.register"));
    const { register, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { busy, errors, message, run } = useSubmit();
    const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });

    if (user) {
        return <Navigate to={redirectTarget(location.state, user)} replace />;
    }

    const set = (name: keyof typeof form) => (event: { target: { value: string } }) =>
        setForm((current) => ({ ...current, [name]: event.target.value }));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        void run(async () => {
            const registered = await register(form);
            navigate(redirectTarget(location.state, registered), { replace: true });
        });
    };

    return (
        <AuthShell
            title={t("auth.joinDurra")}
            footer={<>{t("auth.haveAccount")} <Link to="/login" state={location.state}>{t("auth.login")}</Link></>}
        >
            <form className="stack" onSubmit={submit} noValidate>
                <Field label={t("auth.name")} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
                <Field label={t("auth.email")} type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
                <Field label={t("auth.password")} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} hint={t("auth.passwordHint")} required />
                <Field label={t("auth.passwordConfirm")} type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set("password_confirmation")} required />
                {message && Object.keys(errors).length === 0 && <p className="form-error" role="alert">{message}</p>}
                <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>{t("auth.register")}</button>
                <p className="muted small">{t("auth.agree")} <Link to="/info/privacy" target="_blank">{t("footer.privacy")}</Link> · <Link to="/info/terms" target="_blank">{t("footer.terms")}</Link></p>
            </form>
        </AuthShell>
    );
}

export function ForgotPasswordPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("auth.forgot.title"));
    const { busy, message, run } = useSubmit();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        void run(async () => {
            await authService.forgotPassword(email);
            setSent(true);
        });
    };

    return (
        <AuthShell
            title={t("auth.forgot.title")}
            note={t("auth.forgot.note")}
            footer={<Link to="/login">{t("auth.login")}</Link>}
        >
            {sent ? (
                <p className="form-success" role="status">{t("auth.forgot.sent")}</p>
            ) : (
                <form className="stack" onSubmit={submit} noValidate>
                    {/* Errors are not shown per field so the form does not reveal which emails exist. */}
                    <Field label={t("auth.email")} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                    {message && <p className="form-error" role="alert">{message}</p>}
                    <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>{t("auth.forgot.send")}</button>
                </form>
            )}
        </AuthShell>
    );
}

export function ResetPasswordPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("auth.reset.title"));
    const [params] = useSearchParams();
    const { busy, errors, message, run } = useSubmit();
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [done, setDone] = useState(false);

    const token = params.get("token") ?? "";
    const email = params.get("email") ?? "";

    const submit = (event: FormEvent) => {
        event.preventDefault();
        void run(async () => {
            await authService.resetPassword(token, email, password, confirmation);
            setDone(true);
        });
    };

    return (
        <AuthShell title={t("auth.reset.title")} note={email} footer={<Link to="/login">{t("auth.login")}</Link>}>
            {!token || !email ? (
                <p className="form-error" role="alert">{t("auth.reset.invalid")}</p>
            ) : done ? (
                <p className="form-success" role="status">{t("auth.reset.done")}</p>
            ) : (
                <form className="stack" onSubmit={submit} noValidate>
                    <Field label={t("auth.password")} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} hint={t("auth.passwordHint")} required />
                    <Field label={t("auth.passwordConfirm")} type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                    {message && !errors.password && <p className="form-error" role="alert">{message}</p>}
                    <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>{t("auth.reset.submit")}</button>
                </form>
            )}
        </AuthShell>
    );
}
