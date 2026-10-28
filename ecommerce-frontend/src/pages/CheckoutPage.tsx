import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import Field, { type FieldChange } from "../components/Field";
import Icon from "../components/icons";
import { Loading } from "../components/StateViews";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { usePreferences } from "../context/preferences";
import { useToast } from "../context/toast";
import { errorMessage, fieldErrors } from "../lib/errors";
import * as authService from "../services/authService";
import { createOrder, getOrder, payOrder, type PaymentMethod, type ShippingDetails } from "../services/shopService";
import type { Cart, User } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const METHODS: PaymentMethod[] = ["cash", "card", "paypal"];

export default function CheckoutPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("checkout.title"));
    const { user, status } = useAuth();
    const { cart, loading } = useCart();

    if (status === "checking") {
        return <section className="container section"><Loading /></section>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: "/checkout" }} replace />;
    }

    if (loading || !cart) {
        return <section className="container section"><Loading /></section>;
    }

    // Mounted only once the user is known, so the form starts from their name.
    return <CheckoutForm user={user} cart={cart} />;
}

function CheckoutForm({ user, cart }: { user: User; cart: Cart }) {
    const { t, formatMoney } = usePreferences();
    const { setUser } = useAuth();
    const { refresh } = useCart();
    const { notify } = useToast();
    const navigate = useNavigate();
    const verified = Boolean(user.email_verified_at);

    useEffect(() => {
        if (verified) {
            return;
        }

        // The confirmation link is usually opened in another tab: re-check on return.
        const sync = () => {
            authService.me().then(setUser).catch(() => undefined);
        };

        window.addEventListener("focus", sync);
        return () => window.removeEventListener("focus", sync);
    }, [verified, setUser]);

    const resend = async () => {
        try {
            await authService.resendVerification();
            notify(t("account.resent"));
        } catch (error) {
            notify(errorMessage(error, t("common.error"), t("auth.tooMany")), "error");
        }
    };

    const [form, setForm] = useState<ShippingDetails>({
        shipping_name: user.name,
        shipping_phone: "",
        shipping_address: "",
        shipping_city: "",
        shipping_postal_code: "",
        shipping_country: "Morocco",
        notes: "",
    });
    const [method, setMethod] = useState<PaymentMethod>("cash");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    if (cart.items.length === 0 && !submitting) {
        return <Navigate to="/cart" replace />;
    }

    const set = (name: keyof ShippingDetails) => (event: FieldChange) =>
        setForm((current) => ({ ...current, [name]: event.target.value }));

    const submit = async (event: FormEvent) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setSubmitting(true);
        setErrors({});

        let orderId: number | null = null;

        try {
            const order = await createOrder({
                ...form,
                shipping_postal_code: form.shipping_postal_code || undefined,
                notes: form.notes || undefined,
            });

            orderId = order.id;

            await payOrder(order.id, method);
            await refresh();

            notify(t("checkout.success", { id: order.id }));
            navigate(`/account/orders/${order.id}`, { replace: true, state: { placed: true } });
        } catch (error) {
            if (orderId !== null) {
                // The order exists (stock reserved). The payment response may have been
                // lost after the server recorded it, so trust the order's own status.
                await refresh().catch(() => undefined);
                const paid = await getOrder(orderId).then((order) => order.status !== "pending").catch(() => false);

                if (paid) {
                    notify(t("checkout.success", { id: orderId }));
                } else {
                    notify(t("checkout.orderCreatedPaymentFailed", { id: orderId }), "error");
                }

                navigate(`/account/orders/${orderId}`, { replace: true, state: { placed: paid } });
                return;
            }

            setErrors(fieldErrors(error));
            notify(errorMessage(error, t("common.error")), "error");
            setSubmitting(false);
        }
    };

    return (
        <section className="container section">
            <h1 className="section-title">{t("checkout.title")}</h1>

            <form className="with-summary" onSubmit={submit} noValidate>
                <div className="stack">
                    {!verified && (
                        <p className="note note--warn" role="status">
                            <Icon name="alert" size={16} /> {t("checkout.verifyFirst")}{" "}
                            <button type="button" className="link-btn" onClick={resend}>{t("account.resend")}</button>
                        </p>
                    )}
                    <fieldset className="panel" disabled={submitting}>
                        <legend className="panel__title">{t("checkout.shipping")}</legend>
                        <div className="form-grid">
                            <Field label={t("checkout.name")} value={form.shipping_name} onChange={set("shipping_name")} error={errors.shipping_name} required autoComplete="name" />
                            <Field label={t("checkout.phone")} value={form.shipping_phone} onChange={set("shipping_phone")} error={errors.shipping_phone} required type="tel" autoComplete="tel" />
                            <Field label={t("checkout.address")} value={form.shipping_address} onChange={set("shipping_address")} error={errors.shipping_address} required autoComplete="street-address" />
                            <Field label={t("checkout.city")} value={form.shipping_city} onChange={set("shipping_city")} error={errors.shipping_city} required autoComplete="address-level2" />
                            <Field label={t("checkout.postal")} value={form.shipping_postal_code} onChange={set("shipping_postal_code")} error={errors.shipping_postal_code} autoComplete="postal-code" />
                            <Field label={t("checkout.country")} value={form.shipping_country} onChange={set("shipping_country")} error={errors.shipping_country} required autoComplete="country-name" />
                        </div>
                        <Field label={t("checkout.notes")} value={form.notes} onChange={set("notes")} error={errors.notes} multiline />
                    </fieldset>

                    <fieldset className="panel" disabled={submitting}>
                        <legend className="panel__title">{t("checkout.payment")}</legend>
                        <div className="methods">
                            {METHODS.map((item) => (
                                <label key={item} className={`method${method === item ? " method--active" : ""}`}>
                                    <input type="radio" name="method" value={item} checked={method === item} onChange={() => setMethod(item)} />
                                    <Icon name={item === "cash" ? "truck" : "card"} size={20} />
                                    <span>{t(`checkout.method.${item}`)}</span>
                                </label>
                            ))}
                        </div>
                        <p className="note"><Icon name="alert" size={16} /> {t("checkout.simulated")}</p>
                    </fieldset>
                </div>

                <aside className="summary">
                    <h2>{t("checkout.summary")}</h2>
                    <ul className="summary__items">
                        {cart.items.map((item) => (
                            <li key={item.id}>
                                <span>{item.product_name} × {item.quantity}</span>
                                <span>{formatMoney(item.subtotal)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="summary__row"><span>{t("cart.delivery")}</span><span>{t("cart.free")}</span></div>
                    <div className="summary__row summary__row--total"><span>{t("cart.total")}</span><strong>{formatMoney(cart.total)}</strong></div>

                    <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting || !verified} aria-busy={submitting}>
                        {submitting ? <><span className="spinner spinner--sm" aria-hidden="true" /> {t("checkout.processing")}</> : t("checkout.placeOrder")}
                    </button>
                    {submitting && <p className="muted small" role="status">{t("checkout.processing.note")}</p>}
                    <p className="muted small">{t("checkout.agree")} <Link to="/info/terms" target="_blank">{t("footer.terms")}</Link></p>
                    <Link to="/cart" className="btn btn--ghost btn--block">{t("cart.title")}</Link>
                </aside>
            </form>
        </section>
    );
}
