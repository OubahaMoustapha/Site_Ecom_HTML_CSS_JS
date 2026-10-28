import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../../context/auth";
import { useCart } from "../../context/cart";
import { usePreferences } from "../../context/preferences";
import { useWishlist } from "../../context/wishlist";
import { WORLDS, worldName } from "../../lib/worlds";
import Icon from "../icons";
import Logo from "../Logo";
import ModeSwitcher from "./ModeSwitcher";
import { STORE } from "../../config/store";

export default function Header() {
    const { t, lang, setLang } = usePreferences();
    const { user } = useAuth();
    const { cart } = useCart();
    const wishlist = useWishlist();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const onSearch = (event: FormEvent) => {
        event.preventDefault();
        const q = query.trim();

        if (q) {
            navigate(`/search?q=${encodeURIComponent(q)}`);
        }
    };

    return (
        <>
            {/* The announcement bar scrolls away; the header below stays pinned. */}
            <div className="topbar">{t("topbar.message", { days: STORE.returnDays })}</div>
            <header className="site-header">
                <div className="container header-main">
                    <Logo />

                    <form className="search" role="search" onSubmit={onSearch}>
                        <Icon name="search" size={18} />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={t("nav.search")}
                            aria-label={t("nav.search")}
                        />
                    </form>

                    <div className="header-actions">
                        <ModeSwitcher />

                        <button
                            type="button"
                            className="icon-btn lang-btn"
                            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                            aria-label={t("lang.switch")}
                        >
                            <Icon name="globe" size={18} />
                            <span>{lang === "ar" ? "EN" : "ع"}</span>
                        </button>

                        <Link to="/wishlist" className="icon-btn" aria-label={t("nav.wishlist")}>
                            <Icon name="heart" size={18} />
                            {wishlist.ids.length > 0 && <span className="icon-btn__count">{wishlist.ids.length}</span>}
                        </Link>

                        <Link to={user ? "/account" : "/login"} className="icon-btn" aria-label={t("nav.account")}>
                            <Icon name="user" size={18} />
                        </Link>

                        {user?.role === "admin" && (
                            <Link to="/admin" className="icon-btn" aria-label={t("nav.admin")}>
                                <Icon name="grid" size={18} />
                            </Link>
                        )}

                        <Link to="/cart" className="cart-btn">
                            <Icon name="cart" size={18} />
                            <span>{t("nav.cart")}</span>
                            <span className="cart-btn__count">{cart?.total_quantity ?? 0}</span>
                        </Link>
                    </div>
                </div>

                <nav className="container world-nav" aria-label={t("nav.worlds")}>
                    <ul>
                        {WORLDS.map((world) => (
                            <li key={world.key}>
                                <NavLink to={`/world/${world.key}`}>
                                    <span className="dot" style={{ background: world.dot }} />
                                    {t(worldName(world.key))}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                    <Link to="/search?sort=newest" className="world-nav__deals">{t("nav.newArrivals")}</Link>
                </nav>
            </header>
        </>
    );
}
