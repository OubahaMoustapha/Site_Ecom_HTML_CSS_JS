import { Link } from "react-router";
import Icon from "../components/icons";
import QtyStepper from "../components/QtyStepper";
import { Empty, Loading } from "../components/StateViews";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { usePreferences } from "../context/preferences";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function CartPage() {
    const { t, formatMoney } = usePreferences();
    useDocumentTitle(t("cart.title"));
    const { user, status } = useAuth();
    const { cart, loading, update, remove, clear } = useCart();

    if (status === "checking") {
        return <section className="container section"><Loading /></section>;
    }

    if (!user) {
        return (
            <section className="container section">
                <Empty
                    icon="cart"
                    title={t("product.loginToBuy")}
                    action={<Link to="/login" state={{ from: "/cart" }} className="btn btn--primary">{t("auth.login")}</Link>}
                />
            </section>
        );
    }

    if (loading || !cart) {
        return <section className="container section"><Loading /></section>;
    }

    if (cart.items.length === 0) {
        return (
            <section className="container section">
                <Empty
                    icon="cart"
                    title={t("cart.empty")}
                    note={t("cart.empty.note")}
                    action={<Link to="/worlds" className="btn btn--primary">{t("home.shopNow")}</Link>}
                />
            </section>
        );
    }

    return (
        <section className="container section">
            <h1 className="section-title">{t("cart.title")}</h1>

            <div className="with-summary">
                <ul className="cart-list">
                    {cart.items.map((item) => (
                        <li key={item.id} className="cart-line">
                            <div className="cart-line__info">
                                <strong>{item.product_name}</strong>
                                <span className="mono muted">{item.sku}</span>
                                <span className="muted">{formatMoney(item.price)}</span>
                            </div>
                            <QtyStepper
                                value={item.quantity}
                                min={1}
                                onChange={(quantity) => update(item.id, quantity)}
                            />
                            <strong className="cart-line__total">{formatMoney(item.subtotal)}</strong>
                            <button type="button" className="icon-btn" onClick={() => remove(item.id)} aria-label={`${t("cart.remove")}: ${item.product_name}`}>
                                <Icon name="trash" size={18} />
                            </button>
                        </li>
                    ))}
                </ul>

                <aside className="summary">
                    <h2>{t("checkout.summary")}</h2>
                    <div className="summary__row"><span>{t("cart.items", { count: cart.total_quantity })}</span><span>{formatMoney(cart.total)}</span></div>
                    <div className="summary__row"><span>{t("cart.delivery")}</span><span>{t("cart.free")}</span></div>
                    <div className="summary__row summary__row--total"><span>{t("cart.total")}</span><strong>{formatMoney(cart.total)}</strong></div>
                    <Link to="/checkout" className="btn btn--primary btn--block btn--lg">{t("cart.checkout")}</Link>
                    <Link to="/worlds" className="btn btn--ghost btn--block">{t("cart.continue")}</Link>
                    <button type="button" className="link-btn" onClick={clear}>{t("cart.clear")}</button>
                </aside>
            </div>
        </section>
    );
}
