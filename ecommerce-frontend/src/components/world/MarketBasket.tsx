import { Link } from "react-router";
import { useAuth } from "../../context/auth";
import { useCart } from "../../context/cart";
import { usePreferences } from "../../context/preferences";

/** Live cart summary shown beside the food grid, as in the market design. */
export default function MarketBasket() {
    const { t, formatMoney } = usePreferences();
    const { user } = useAuth();
    const { cart } = useCart();

    const items = cart?.items ?? [];

    return (
        <aside className="basket" aria-label={t("food.basket")}>
            <h2 className="basket__title">{t("food.basket")}</h2>

            {!user || items.length === 0 ? (
                <p className="muted">{user ? t("food.basket.empty") : t("product.loginToBuy")}</p>
            ) : (
                <>
                    <ul className="basket__list">
                        {items.map((item) => (
                            <li key={item.id}>
                                <span>{item.product_name} · {item.quantity}</span>
                                <strong>{formatMoney(item.subtotal)}</strong>
                            </li>
                        ))}
                    </ul>
                    <div className="basket__row">
                        <span>{t("cart.delivery")}</span>
                        <span>{t("cart.free")}</span>
                    </div>
                    <div className="basket__row basket__row--total">
                        <span>{t("cart.total")}</span>
                        <strong>{formatMoney(cart?.total ?? 0)}</strong>
                    </div>
                </>
            )}

            {user ? (
                <Link to="/checkout" className={`btn btn--primary btn--block${items.length === 0 ? " is-disabled" : ""}`} aria-disabled={items.length === 0}>
                    {t("cart.checkout")}
                </Link>
            ) : (
                <Link to="/login" className="btn btn--primary btn--block">{t("auth.login")}</Link>
            )}
        </aside>
    );
}
