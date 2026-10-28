import { useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { Async, Empty } from "../../components/StateViews";
import { PaymentBadge, StatusBadge } from "../../components/StatusBadge";
import { usePreferences } from "../../context/preferences";
import { useAsync } from "../../hooks/useAsync";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ORDER_STATUSES } from "../../lib/orders";
import { getAdminOrdersPage } from "../../services/adminService";
import StatusChanger from "../../components/admin/StatusChanger";
import type { Order } from "../../types/api";

export default function AdminOrders() {
    const { t } = usePreferences();
    useDocumentTitle(t("admin.orders"));
    const [params, setParams] = useSearchParams();
    const status = ORDER_STATUSES.find((value) => value === params.get("status"));
    const page = Math.max(1, Number(params.get("page")) || 1);

    const result = useAsync(useCallback(() => getAdminOrdersPage(page, status), [page, status]));

    const go = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(params);
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value); else next.delete(key);
        }
        setParams(next);
    };

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <h1 className="admin-page__title">{t("admin.orders")}</h1>
                <label className="sort-select">
                    <span>{t("admin.filterStatus")}</span>
                    <select value={status ?? ""} onChange={(event) => go({ status: event.target.value || undefined, page: undefined })}>
                        <option value="">{t("listing.all")}</option>
                        {ORDER_STATUSES.map((value) => <option key={value} value={value}>{t(`status.${value}`)}</option>)}
                    </select>
                </label>
            </div>

            <Async {...result}>
                {({ data, meta }) => data.length === 0 ? <Empty icon="list" title={t("account.noOrders")} /> : (
                    <div className={`panel${result.loading ? " is-refreshing" : ""}`}>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>{t("admin.customer")}</th>
                                        <th>{t("order.shipping")}</th>
                                        <th className="num">{t("admin.amount")}</th>
                                        <th>{t("admin.method")}</th>
                                        <th>{t("order.status")}</th>
                                        <th>{t("admin.changeStatus")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((order) => <OrderRow key={order.id} order={order} onChanged={result.reload} />)}
                                </tbody>
                            </table>
                        </div>

                        {meta.last_page > 1 && (
                            <nav className="pager">
                                <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>{t("listing.prev")}</button>
                                <span>{t("listing.page", { page, total: meta.last_page })}</span>
                                <button type="button" className="btn btn--outline btn--sm" disabled={page >= meta.last_page} onClick={() => go({ page: String(page + 1) })}>{t("listing.next")}</button>
                            </nav>
                        )}
                    </div>
                )}
            </Async>
        </div>
    );
}

function OrderRow({ order, onChanged }: { order: Order; onChanged: () => void }) {
    const { t, formatMoney, formatDate } = usePreferences();

    return (
        <tr>
            <td className="mono"><Link to={`/admin/orders/${order.id}`}>D-{order.id}</Link><small className="muted">{formatDate(order.created_at)}</small></td>
            <td>{order.user?.name ?? "—"}<small className="muted">{order.user?.email}</small></td>
            <td>{order.shipping.city ?? "—"}</td>
            <td className="num mono">{formatMoney(order.total)}</td>
            <td>{order.payment ? <PaymentBadge status={order.payment.status} /> : <span className="muted">{t("order.unpaid")}</span>}</td>
            <td><StatusBadge status={order.status} /></td>
            <td><StatusChanger order={order} onChanged={onChanged} /></td>
        </tr>
    );
}
