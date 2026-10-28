import { Link } from "react-router";
import RevenueChart, { type Point } from "../../components/admin/RevenueChart";
import { Async } from "../../components/StateViews";
import { StatusBadge } from "../../components/StatusBadge";
import { useAuth } from "../../context/auth";
import { usePreferences } from "../../context/preferences";
import { useAsync } from "../../hooks/useAsync";
import { getAllAdminOrders, getLowStock } from "../../services/adminService";
import type { Inventory, Order, OrderStatus } from "../../types/api";

const DAYS = 30;
const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "completed", "cancelled"];

async function loadDashboard() {
    const [orders, lowStock] = await Promise.all([getAllAdminOrders(), getLowStock()]);
    return { orders, lowStock: lowStock.data };
}

/** Orders that brought money in: paid and not refunded. */
function isRevenue(order: Order) {
    return order.payment?.status === "paid";
}

function revenueByDay(orders: Order[], locale: string): Point[] {
    const today = new Date();
    const format = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", numberingSystem: "latn" });
    const totals = new Map<string, number>();

    for (const order of orders.filter(isRevenue)) {
        const day = (order.payment?.paid_at ?? order.created_at).slice(0, 10);
        totals.set(day, (totals.get(day) ?? 0) + Number(order.total));
    }

    return Array.from({ length: DAYS }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (DAYS - 1 - index));
        const key = date.toISOString().slice(0, 10);
        return { date: key, label: format.format(date), value: totals.get(key) ?? 0 };
    });
}

export default function AdminDashboard() {
    const { t } = usePreferences();
    const { user } = useAuth();
    const result = useAsync(loadDashboard);

    return (
        <div className="admin-page">
            <div className="admin-page__head">
                <div>
                    <p className="muted small">{t("admin.liveData")}</p>
                    <h1 className="admin-page__title">{t("admin.welcome", { name: user?.name ?? "" })}</h1>
                </div>
                <button type="button" className="btn btn--outline btn--sm" onClick={result.reload} disabled={result.loading}>
                    {t("common.retry")}
                </button>
            </div>

            <Async {...result}>
                {({ orders, lowStock }) => <DashboardBody orders={orders} lowStock={lowStock} refreshing={result.loading} />}
            </Async>
        </div>
    );
}

function DashboardBody({ orders, lowStock, refreshing }: { orders: Order[]; lowStock: Inventory[]; refreshing: boolean }) {
    const { t, formatMoney, formatDate, lang } = usePreferences();

    const paid = orders.filter(isRevenue);
    const revenue = paid.reduce((sum, order) => sum + Number(order.total), 0);
    const toProcess = orders.filter((order) => order.status === "paid" || order.status === "processing").length;
    const cancelled = orders.filter((order) => order.status === "cancelled").length;
    const points = revenueByDay(orders, lang === "ar" ? "ar-MA" : "en-GB");

    const byStatus = STATUSES.map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
    }));
    const maxStatus = Math.max(1, ...byStatus.map((entry) => entry.count));

    const sold = new Map<string, { name: string; units: number; revenue: number }>();
    for (const order of orders.filter((entry) => entry.status !== "cancelled")) {
        for (const item of order.items) {
            const current = sold.get(item.sku) ?? { name: item.product_name, units: 0, revenue: 0 };
            current.units += item.quantity;
            current.revenue += Number(item.subtotal);
            sold.set(item.sku, current);
        }
    }
    const top = [...sold.values()].sort((a, b) => b.units - a.units).slice(0, 5);

    const kpis = [
        // Tiles summarise, so whole units; exact amounts stay in the tables.
        { label: t("admin.kpi.revenue"), value: formatMoney(Math.round(revenue)) },
        { label: t("admin.kpi.orders"), value: String(orders.length) },
        { label: t("admin.kpi.aov"), value: formatMoney(Math.round(paid.length ? revenue / paid.length : 0)) },
        { label: t("admin.kpi.toProcess"), value: String(toProcess) },
        { label: t("admin.kpi.cancelled"), value: String(cancelled) },
    ];

    return (
        <div className={`admin-grid${refreshing ? " is-refreshing" : ""}`}>
            <div className="kpis">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="kpi">
                        <span className="kpi__label">{kpi.label}</span>
                        <strong className="kpi__value mono">{kpi.value}</strong>
                    </div>
                ))}
            </div>

            <section className="panel admin-card admin-card--wide">
                <div className="admin-card__head">
                    <h2>{t("admin.revenue")}</h2>
                    <span className="muted small">{t("admin.revenue.note")}</span>
                </div>
                <RevenueChart points={points} title={t("admin.revenue")} />
            </section>

            <section className="panel admin-card">
                <h2>{t("admin.byStatus")}</h2>
                <ul className="hbars">
                    {byStatus.map((entry) => (
                        <li key={entry.status} title={`${t(`status.${entry.status}`)}: ${entry.count}`}>
                            <span className="hbars__label">{t(`status.${entry.status}`)}</span>
                            <span className="hbars__track">
                                <span className="hbars__fill" style={{ inlineSize: `${(entry.count / maxStatus) * 100}%` }} />
                            </span>
                            <span className="hbars__value mono">{entry.count}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="panel admin-card admin-card--wide">
                <div className="admin-card__head">
                    <h2>{t("admin.recentOrders")}</h2>
                    <Link to="/admin/orders" className="link-arrow">{t("admin.viewAll")}</Link>
                </div>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t("admin.customer")}</th>
                                <th>{t("order.date")}</th>
                                <th className="num">{t("admin.amount")}</th>
                                <th>{t("order.status")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 6).map((order) => (
                                <tr key={order.id}>
                                    <td className="mono">D-{order.id}</td>
                                    <td>{order.user?.name ?? "—"}</td>
                                    <td>{formatDate(order.created_at)}</td>
                                    <td className="num mono">{formatMoney(order.total)}</td>
                                    <td><StatusBadge status={order.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="panel admin-card">
                <h2>{t("admin.lowStock")}</h2>
                {lowStock.length === 0 ? <p className="muted">{t("admin.lowStock.none")}</p> : (
                    <ul className="alerts">
                        {lowStock.map((inventory) => (
                            <li key={inventory.id}>
                                <span className="mono">{inventory.variant?.sku ?? `#${inventory.product_variant_id}`}</span>
                                <span className="alerts__track">
                                    <span style={{ inlineSize: `${Math.min(100, (inventory.quantity / Math.max(1, inventory.low_stock_threshold)) * 100)}%` }} />
                                </span>
                                <strong>{t("admin.pieces", { count: inventory.quantity })}</strong>
                            </li>
                        ))}
                    </ul>
                )}
                <Link to="/admin/inventory" className="btn btn--outline btn--block btn--sm">{t("admin.inventory")}</Link>
            </section>

            <section className="panel admin-card">
                <h2>{t("admin.topProducts")}</h2>
                <ol className="ranking">
                    {top.map((product, index) => (
                        <li key={product.name + index}>
                            <span className="ranking__pos mono">{String(index + 1).padStart(2, "0")}</span>
                            <span className="ranking__name">
                                <strong>{product.name}</strong>
                                <small className="muted">{t("admin.units", { count: product.units })}</small>
                            </span>
                            <span className="mono">{formatMoney(product.revenue)}</span>
                        </li>
                    ))}
                </ol>
            </section>
        </div>
    );
}
