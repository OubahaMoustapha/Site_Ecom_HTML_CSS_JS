import { Link } from "react-router";
import Icon, { type IconName } from "../components/icons";
import ProductCard from "../components/ProductCard";
import { Async } from "../components/StateViews";
import WorldTiles from "../components/WorldTiles";
import { usePreferences } from "../context/preferences";
import { useAsync } from "../hooks/useAsync";
import type { TranslationKey } from "../i18n/dictionaries";
import { loadWorldTrees, WORLDS, worldOfCategory } from "../lib/worlds";
import { getProducts } from "../services/productService";
import type { Product } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { STORE } from "../config/store";

const TRUST_VARS = { days: STORE.returnDays, min: STORE.deliveryHours.min, max: STORE.deliveryHours.max };

const TRUST: Array<[IconName, TranslationKey, TranslationKey]> = [
    ["truck", "home.trust.delivery", "home.trust.delivery.note"],
    ["card", "home.trust.cod", "home.trust.cod.note"],
    ["refresh", "home.trust.returns", "home.trust.returns.note"],
    ["headset", "home.trust.support", "home.trust.support.note"],
];

async function loadNewArrivals() {
    const page = await getProducts({ sort: "-created_at", is_active: true, per_page: 4 });
    return page.data;
}

/**
 * The cheapest product of each world, so the picks show the whole store.
 * One listing request normally covers every world; a world missing from it
 * (large catalogue) gets its own request.
 */
async function loadPicks(): Promise<Product[]> {
    const [trees, cheapest] = await Promise.all([
        loadWorldTrees(),
        getProducts({ is_active: true, sort: "price", per_page: 50 }),
    ]);

    const firsts = await Promise.all(
        trees
            .filter((tree) => tree.parent !== null)
            .map(async (tree) => {
                const found = cheapest.data.find((product) => worldOfCategory(trees, product.category_id) === tree.world.key);

                if (found) {
                    return found;
                }

                const page = await getProducts({ category_id: tree.parent?.id, is_active: true, sort: "price", per_page: 1 });
                return page.data[0];
            })
    );

    return firsts.filter((product): product is Product => Boolean(product));
}

export default function HomePage() {
    const { t, mode } = usePreferences();
    useDocumentTitle(null);

    const arrivals = useAsync(loadNewArrivals);
    const picks = useAsync(loadPicks);

    return (
        <>
            <section className="container hero-home">
                <div className="hero-home__card">
                    <span className="badge badge--accent">{t(`home.badge.${mode}`)}</span>
                    <h1 className="display">{t(`home.title.${mode}`)}</h1>
                    <p className="lead">{t("home.subtitle")}</p>
                    <div className="actions">
                        <Link to="/worlds" className="btn btn--primary btn--lg">{t("home.shopNow")}</Link>
                        <Link to="/search?sort=newest" className="btn btn--outline btn--lg">{t("home.explore")}</Link>
                    </div>
                    <dl className="hero-stats">
                        <div><dt>{WORLDS.length}</dt><dd>{t("home.stat.worlds")}</dd></div>
                        <div><dt>{STORE.supportBadge}</dt><dd>{t("home.stat.support")}</dd></div>
                        <div><dt>{t("home.stat.returnsValue", { days: STORE.returnDays })}</dt><dd>{t("home.stat.returns")}</dd></div>
                    </dl>
                </div>

                <WorldTiles />
            </section>

            <section className="container section">
                <div className="band band--accent">
                    <div className="section-head">
                        <h2 className="section-title"><Icon name="bolt" size={26} /> {t("home.newArrivals")}</h2>
                        <p className="muted">{t("home.newArrivals.note")}</p>
                    </div>
                    <Async {...arrivals}>
                        {(products) => (
                            <div className="grid grid--4">
                                {products.map((product) => <ProductCard key={product.id} product={product} />)}
                            </div>
                        )}
                    </Async>
                </div>
            </section>

            <section className="container section">
                <div className="section-head">
                    <h2 className="section-title">{t("home.picks")}</h2>
                    <Link to="/worlds" className="link-arrow">{t("home.viewAll")} <Icon name="arrow" size={16} className="flip-rtl" /></Link>
                </div>
                <Async {...picks}>
                    {(products) => (
                        <div className="grid grid--4">
                            {products.map((product) => <ProductCard key={product.id} product={product} />)}
                        </div>
                    )}
                </Async>
            </section>

            <section className="container section">
                <ul className="trust">
                    {TRUST.map(([icon, title, note]) => (
                        <li key={title}>
                            <span className="trust__icon"><Icon name={icon} size={22} /></span>
                            <span>
                                <strong>{t(title)}</strong>
                                <small>{t(note, TRUST_VARS)}</small>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}
