import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import Field from "../components/Field";
import Icon from "../components/icons";
import { Async, Empty, Loading } from "../components/StateViews";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/auth";
import { usePreferences } from "../context/preferences";
import { useToast } from "../context/toast";
import { useAsync } from "../hooks/useAsync";
import { errorMessage, fieldErrors } from "../lib/errors";
import * as authService from "../services/authService";
import { getOrders } from "../services/shopService";
import type { User } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function AccountPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("account.title"));
    const { user, status, logout } = useAuth();
    const [params] = useSearchParams();

    if (status === "checking") {
        return <section className="container section"><Loading /></section>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: "/account" }} replace />;
    }

    return (
        <section className="container section">
            <div className="section-head">
                <h1 className="section-title">{t("account.title")}</h1>
                <button type="button" className="btn btn--outline btn--sm" onClick={logout}>
                    <Icon name="logout" size={16} /> {t("auth.logout")}
                </button>
            </div>

            {params.get("verified") === "1" && user.email_verified_at && (
                <p className="note note--success" role="status"><Icon name="check" size={16} /> {t("account.verified")}</p>
            )}

            <div className="account-grid">
                <div className="stack">
                    <ProfileForm key={user.id} user={user} />
                    <PasswordForm />
                </div>
                <OrdersList />
            </div>
        </section>
    );
}

function ProfileForm({ user }: { user: User }) {
    const { t } = usePreferences();
    const { setUser } = useAuth();
    const { notify } = useToast();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setErrors({});

        try {
            setUser(await authService.updateProfile(name, email));
            notify(t("account.saved"));
        } catch (error) {
            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        try {
            await authService.resendVerification();
            notify(t("account.resent"));
        } catch (error) {
            notify(errorMessage(error, t("common.error"), t("auth.tooMany")), "error");
        }
    };

    return (
        <form className="panel stack" onSubmit={submit} noValidate>
            <h2 className="panel__title">{t("account.profile")}</h2>
            {!user.email_verified_at && (
                <p className="note note--warn">
                    <Icon name="alert" size={16} /> {t("account.unverified")}{" "}
                    <button type="button" className="link-btn" onClick={resend}>{t("account.resend")}</button>
                </p>
            )}
            <Field label={t("auth.name")} value={name} onChange={(event) => setName(event.target.value)} error={errors.name} autoComplete="name" />
            <Field label={t("auth.email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} error={errors.email} autoComplete="email" />
            <button type="submit" className="btn btn--primary" disabled={busy}>{t("account.save")}</button>
        </form>
    );
}

function PasswordForm() {
    const { t } = usePreferences();
    const { notify } = useToast();
    const [form, setForm] = useState({ current: "", next: "", confirm: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setErrors({});

        try {
            await authService.changePassword(form.current, form.next, form.confirm);
            setForm({ current: "", next: "", confirm: "" });
            notify(t("account.saved"));
        } catch (error) {
            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form className="panel stack" onSubmit={submit} noValidate>
            <h2 className="panel__title">{t("account.password")}</h2>
            <Field label={t("account.currentPassword")} type="password" autoComplete="current-password" value={form.current} onChange={(event) => setForm({ ...form, current: event.target.value })} error={errors.current_password} />
            <Field label={t("account.newPassword")} type="password" autoComplete="new-password" value={form.next} onChange={(event) => setForm({ ...form, next: event.target.value })} error={errors.password} hint={t("auth.passwordHint")} />
            <Field label={t("auth.passwordConfirm")} type="password" autoComplete="new-password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
            <button type="submit" className="btn btn--outline" disabled={busy}>{t("account.save")}</button>
        </form>
    );
}

function OrdersList() {
    const { t, formatMoney, formatDate } = usePreferences();
    const orders = useAsync(getOrders);

    return (
        <div className="panel">
            <h2 className="panel__title">{t("account.orders")}</h2>
            <Async {...orders}>
                {(list) => list.length === 0 ? (
                    <Empty icon="list" title={t("account.noOrders")} action={<Link to="/worlds" className="btn btn--primary btn--sm">{t("home.shopNow")}</Link>} />
                ) : (
                    <ul className="order-list">
                        {list.map((order) => (
                            <li key={order.id}>
                                <Link to={`/account/orders/${order.id}`} className="order-row">
                                    <span>
                                        <strong className="mono">{t("order.number", { id: order.id })}</strong>
                                        <small className="muted">{formatDate(order.created_at)} · {t("cart.items", { count: order.items_count })}</small>
                                    </span>
                                    <StatusBadge status={order.status} />
                                    <strong>{formatMoney(order.total)}</strong>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Async>
        </div>
    );
}
