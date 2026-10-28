import { useCallback, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import Icon from "../components/icons";
import { Async } from "../components/StateViews";
import { PaymentBadge, StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/auth";
import { usePreferences } from "../context/preferences";
import { useToast } from "../context/toast";
import { useAsync } from "../hooks/useAsync";
import { errorMessage } from "../lib/errors";
import { cancelOrder, downloadInvoice, getOrder, payOrder, type PaymentMethod } from "../services/shopService";
import type { Order } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function OrderPage() {
    const { id = "" } = useParams();
    const { t } = usePreferences();
    useDocumentTitle(t("order.number", { id }));
    const { user, status } = useAuth();
    const result = useAsync(useCallback(() => getOrder(id), [id]));

    if (status !== "checking" && !user) {
        return <Navigate to="/login" state={{ from: `/account/orders/${id}` }} replace />;
    }

    return (
        <section className="container section">
            <Async {...result}>
                {(order) => <OrderDetails order={order} onChange={result.reload} />}
            </Async>
        </section>
    );
}

function OrderDetails({ order, onChange }: { order: Order; onChange: () => void }) {
    const { t, formatMoney, formatDate } = usePreferences();
    const { notify } = useToast();
    const location = useLocation();
    const [busy, setBusy] = useState<"pay" | "cancel" | "invoice" | null>(null);
    const [method, setMethod] = useState<PaymentMethod>("cash");

    const placed = (location.state as { placed?: boolean } | null)?.placed;
    const canPay = order.status === "pending" && !order.payment;
    const canCancel = order.status === "pending";

    const act = async (kind: "pay" | "cancel" | "invoice", action: () => Promise<unknown>) => {
        setBusy(kind);

        try {
            await action();
            if (kind !== "invoice") onChange();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(null);
        }
    };

    const invoice = () => act("invoice", async () => {
        const blob = await downloadInvoice(order.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoice-${order.id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    });

    return (
        <div className="order">
            <Link to="/account" className="link-arrow link-arrow--back"><Icon name="arrow" size={16} className="flip-rtl rotate" /> {t("order.back")}</Link>

            {placed && (
                <div className="note note--success" role="status">
                    <Icon name="check" size={18} /> {t("checkout.success", { id: order.id })} — {t("checkout.success.note")}
                </div>
            )}

            <div className="section-head">
                <h1 className="section-title mono">{t("order.number", { id: order.id })}</h1>
                <StatusBadge status={order.status} />
            </div>
            <p className="muted">{formatDate(order.created_at)}</p>

            <div className="with-summary">
                <div className="panel">
                    <h2 className="panel__title">{t("order.items")}</h2>
                    <table className="table">
                        <tbody>
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.product_name}</strong>
                                        <small className="mono muted">{item.sku}</small>
                                    </td>
                                    <td>{formatMoney(item.price)} × {item.quantity}</td>
                                    <td className="num"><strong>{formatMoney(item.subtotal)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {order.shipping.address && (
                        <>
                            <h2 className="panel__title">{t("order.shipping")}</h2>
                            <address className="address">
                                {order.shipping.name}<br />
                                {order.shipping.address}<br />
                                {order.shipping.city} {order.shipping.postal_code}<br />
                                {order.shipping.country}<br />
                                <span className="mono">{order.shipping.phone}</span>
                            </address>
                        </>
                    )}
                </div>

                <aside className="summary">
                    <div className="summary__row summary__row--total"><span>{t("order.total")}</span><strong>{formatMoney(order.total)}</strong></div>
                    <div className="summary__row">
                        <span>{t("order.payment")}</span>
                        {order.payment ? <PaymentBadge status={order.payment.status} /> : <span className="muted">{t("order.unpaid")}</span>}
                    </div>

                    {canPay && (
                        <div className="stack">
                            <select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} aria-label={t("checkout.payment")}>
                                <option value="cash">{t("checkout.method.cash")}</option>
                                <option value="card">{t("checkout.method.card")}</option>
                                <option value="paypal">{t("checkout.method.paypal")}</option>
                            </select>
                            <button type="button" className="btn btn--primary btn--block" disabled={busy !== null} onClick={() => act("pay", () => payOrder(order.id, method))}>
                                {busy === "pay" ? t("checkout.processing") : t("order.pay")}
                            </button>
                        </div>
                    )}

                    <button type="button" className="btn btn--outline btn--block" disabled={busy !== null} onClick={invoice}>
                        <Icon name="download" size={16} /> {t("order.invoice")}
                    </button>

                    {canCancel && (
                        <button
                            type="button"
                            className="btn btn--ghost btn--block btn--danger"
                            disabled={busy !== null}
                            onClick={() => window.confirm(t("order.cancelConfirm")) && act("cancel", () => cancelOrder(order.id))}
                        >
                            {t("order.cancel")}
                        </button>
                    )}
                </aside>
            </div>
        </div>
    );
}
