import { useCallback } from "react";
import { Link, useParams } from "react-router";
import StatusChanger from "../../components/admin/StatusChanger";
import Icon from "../../components/icons";
import { Async } from "../../components/StateViews";
import { PaymentBadge, StatusBadge } from "../../components/StatusBadge";
import { usePreferences } from "../../context/preferences";
import { useAsync } from "../../hooks/useAsync";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { getAdminOrder } from "../../services/adminService";

export default function AdminOrderDetail() {
    const { id = "" } = useParams();
    const { t, formatMoney, formatDate } = usePreferences();
    const result = useAsync(useCallback(() => getAdminOrder(id), [id]));
    useDocumentTitle(t("order.number", { id }));

    return (
        <div className="admin-page">
            <Link to="/admin/orders" className="link-arrow link-arrow--back">
                <Icon name="arrow" size={16} className="flip-rtl rotate" /> {t("admin.orders")}
            </Link>

            <Async {...result}>
                {(order) => (
                    <>
                        <div className="admin-page__head">
                            <div>
                                <h1 className="admin-page__title mono">{t("order.number", { id: order.id })}</h1>
                                <p className="muted">{formatDate(order.created_at)}</p>
                            </div>
                            <StatusBadge status={order.status} />
                        </div>

                        <div className="admin-grid">
                            <section className="panel admin-card">
                                <h2>{t("order.items")}</h2>
                                <div className="table-wrap">
                                    <table className="table table--compact">
                                        <thead>
                                            <tr><th>{t("admin.field.name")}</th><th>SKU</th><th className="num">{t("admin.variant.price")}</th><th className="num">{t("product.quantity")}</th><th className="num">{t("cart.total")}</th></tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.product_name}</td>
                                                    <td className="mono">{item.sku}</td>
                                                    <td className="num mono">{formatMoney(item.price)}</td>
                                                    <td className="num mono">{item.quantity}</td>
                                                    <td className="num mono">{formatMoney(item.subtotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr><th colSpan={4}>{t("cart.total")}</th><th className="num mono">{formatMoney(order.total)}</th></tr>
                                        </tfoot>
                                    </table>
                                </div>
                                {order.notes && <p className="note"><Icon name="alert" size={16} /> {order.notes}</p>}
                            </section>

                            <div className="stack">
                                <section className="panel admin-card">
                                    <h2>{t("admin.order.timeline")}</h2>
                                    <StatusChanger order={order} onChanged={result.reload} />
                                </section>

                                <section className="panel admin-card">
                                    <h2>{t("admin.order.contact")}</h2>
                                    <p><strong>{order.user?.name ?? "—"}</strong></p>
                                    {order.user?.email && <p><a href={`mailto:${order.user.email}`} dir="ltr">{order.user.email}</a></p>}
                                    {order.shipping.phone && <p><a href={`tel:${order.shipping.phone}`} dir="ltr">{order.shipping.phone}</a></p>}
                                </section>

                                <section className="panel admin-card">
                                    <h2>{t("order.shipping")}</h2>
                                    <address className="address">
                                        {[order.shipping.name, order.shipping.address, [order.shipping.postal_code, order.shipping.city].filter(Boolean).join(" "), order.shipping.country]
                                            .filter(Boolean)
                                            .map((line) => <span key={line}>{line}</span>)}
                                    </address>
                                </section>

                                <section className="panel admin-card">
                                    <h2>{t("order.payment")}</h2>
                                    {order.payment ? (
                                        <dl className="specs">
                                            <div className="specs__pair"><dt>{t("order.status")}</dt><dd><PaymentBadge status={order.payment.status} /></dd></div>
                                            <div className="specs__pair"><dt>{t("admin.method")}</dt><dd>{t(`checkout.method.${order.payment.method}`)}</dd></div>
                                            <div className="specs__pair"><dt>{t("admin.amount")}</dt><dd className="mono">{formatMoney(order.payment.amount)}</dd></div>
                                            {order.payment.transaction_id && <div className="specs__pair"><dt>ID</dt><dd className="mono">{order.payment.transaction_id}</dd></div>}
                                        </dl>
                                    ) : <p className="muted">{t("order.unpaid")}</p>}
                                </section>
                            </div>
                        </div>
                    </>
                )}
            </Async>
        </div>
    );
}
