import { Navigate, NavLink, Outlet } from "react-router";
import { useAuth } from "../../context/auth";
import { usePreferences } from "../../context/preferences";
import Icon from "../icons";
import ModeSwitcher from "../layout/ModeSwitcher";
import Logo from "../Logo";
import { Suspense } from "react";
import { Loading } from "../StateViews";

export default function AdminLayout() {
    const { t, lang, setLang } = usePreferences();
    const { user, status, logout } = useAuth();

    if (status === "checking") {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: "/admin" }} replace />;
    }

    if (user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin">
            <aside className="admin__sidebar">
                <Logo to="/admin" subtitle={t("admin.title")} />
                <nav className="admin__nav" aria-label={t("admin.title")}>
                    <NavLink to="/admin" end><Icon name="grid" /> {t("admin.dashboard")}</NavLink>
                    <NavLink to="/admin/orders"><Icon name="list" /> {t("admin.orders")}</NavLink>
                    <NavLink to="/admin/products"><Icon name="bag" /> {t("admin.products")}</NavLink>
                    <NavLink to="/admin/catalog"><Icon name="filter" /> {t("admin.catalog")}</NavLink>
                    <NavLink to="/admin/inventory"><Icon name="box" /> {t("admin.inventory")}</NavLink>
                </nav>
                <div className="admin__sidebar-foot">
                    <NavLink to="/"><Icon name="home" /> {t("admin.backToStore")}</NavLink>
                    <button type="button" onClick={logout}><Icon name="logout" /> {t("auth.logout")}</button>
                </div>
            </aside>

            <div className="admin__main">
                <div className="admin__toolbar">
                    <ModeSwitcher compact />
                    <button type="button" className="icon-btn lang-btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={t("lang.switch")}>
                        <Icon name="globe" size={18} /><span>{lang === "ar" ? "EN" : "ع"}</span>
                    </button>
                </div>
                {/* Pages load on demand: keep the sidebar visible meanwhile. */}
                <Suspense fallback={<Loading />}>
                    <Outlet />
                </Suspense>
            </div>
        </div>
    );
}
