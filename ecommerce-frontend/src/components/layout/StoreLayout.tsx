import { Suspense, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/auth";
import { useCart } from "../../context/cart";
import { usePreferences } from "../../context/preferences";
import Icon from "../icons";
import { Loading } from "../StateViews";
import Footer from "./Footer";
import Header from "./Header";
import ModeSwitcher from "./ModeSwitcher";

function MobileNav() {
    const { t } = usePreferences();
    const { user } = useAuth();
    const { cart } = useCart();

    return (
        <nav className="mobile-nav" aria-label={t("nav.home")}>
            <NavLink to="/" end><Icon name="home" /><span>{t("nav.home")}</span></NavLink>
            <NavLink to="/worlds"><Icon name="grid" /><span>{t("nav.worlds")}</span></NavLink>
            <NavLink to="/cart">
                <Icon name="cart" />
                <span>{t("nav.cart")}</span>
                {(cart?.total_quantity ?? 0) > 0 && <span className="mobile-nav__count">{cart?.total_quantity}</span>}
            </NavLink>
            <NavLink to={user ? "/account" : "/login"}><Icon name="user" /><span>{t("nav.account")}</span></NavLink>
        </nav>
    );
}

export default function StoreLayout() {
    const { t } = usePreferences();
    const { pathname } = useLocation();

    // Each navigation starts at the top of the page.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="app">
            <a href="#main" className="skip-link">{t("nav.skip")}</a>
            <Header />
            <div className="mobile-modes container"><ModeSwitcher compact /></div>
            <main id="main" className="site-main">
                {/* Pages loaded on demand keep the header and footer on screen. */}
                <Suspense fallback={<Loading />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
            <MobileNav />
        </div>
    );
}
