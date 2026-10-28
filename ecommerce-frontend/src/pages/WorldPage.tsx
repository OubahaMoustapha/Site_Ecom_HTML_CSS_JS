import { useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import Icon from "../components/icons";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";
import { Empty, ErrorView, Loading, NotFound } from "../components/StateViews";
import { CategoryTabs, PriceFilter, SortSelect, type ListingFilters } from "../components/world/ListingControls";
import MarketBasket from "../components/world/MarketBasket";
import { BooksHero, FashionHero, FoodHero, TechHero } from "../components/world/WorldHeroes";
import { usePreferences } from "../context/preferences";
import { useWorlds } from "../context/worlds";
import { useAsync } from "../hooks/useAsync";
import { productIcon } from "../lib/productIcon";
import { primaryImage } from "../lib/variants";
import { isWorldKey, loadWorldProducts, worldName, type SortKey, type WorldTree } from "../lib/worlds";
import type { Product } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

function readFilters(params: URLSearchParams): ListingFilters {
    const number = (name: string) => {
        const value = Number(params.get(name));
        return Number.isFinite(value) && value > 0 ? value : undefined;
    };

    const sort = params.get("sort");

    return {
        cat: number("cat"),
        sort: (["newest", "price", "-price", "name"].includes(sort ?? "") ? sort : "newest") as SortKey,
        min: number("min"),
        max: number("max"),
    };
}

export default function WorldPage() {
    const { key } = useParams();
    const { treeOf, ready, error, reload } = useWorlds();
    const { t } = usePreferences();
    useDocumentTitle(t(isWorldKey(key) ? worldName(key) : "common.notFound"));

    if (!isWorldKey(key)) {
        return <NotFound />;
    }

    if (!ready) {
        return (
            <div className={`world world--${key}`}>
                {error ? <div className="container section"><ErrorView error={error} onRetry={reload} /></div> : <Loading />}
            </div>
        );
    }

    const tree = treeOf(key);

    if (!tree?.parent) {
        return <NotFound />;
    }

    return <WorldContent tree={tree} />;
}

function WorldContent({ tree }: { tree: WorldTree }) {
    const { t } = usePreferences();
    const [params, setParams] = useSearchParams();
    const filters = readFilters(params);
    const key = tree.world.key;

    const { cat, sort, min, max } = filters;

    const loader = useCallback(
        () => loadWorldProducts(tree, { min_price: min, max_price: max, is_active: true }, sort, cat),
        [tree, cat, sort, min, max]
    );

    const { data, error, loading, reload } = useAsync(loader);

    const setFilter = (changes: Partial<ListingFilters>) => {
        const next = { ...filters, ...changes };
        const search = new URLSearchParams();

        if (next.cat) search.set("cat", String(next.cat));
        if (next.sort !== "newest") search.set("sort", next.sort);
        if (next.min) search.set("min", String(next.min));
        if (next.max) search.set("max", String(next.max));

        setParams(search, { replace: true });
    };

    const products = data ?? [];

    const grid = (style: "tech" | "fashion" | "market", columns: string) => {
        if (error) return <ErrorView error={error} onRetry={reload} />;
        if (!data) return <Loading />;
        if (products.length === 0) return <Empty icon="search" title={t("listing.empty")} />;

        return (
            <div className={`grid ${columns}${loading ? " is-refreshing" : ""}`}>
                {products.map((product) => <ProductCard key={product.id} product={product} style={style} />)}
            </div>
        );
    };

    const toolbar = (
        <div className="listing-bar">
            <p className="listing-bar__count">{t("listing.results", { count: products.length })}</p>
            <SortSelect value={sort} onChange={(value) => setFilter({ sort: value })} />
        </div>
    );

    return (
        <div className={`world world--${key}`} data-world={key}>
            <div className="container">
                {key === "electronics" && (
                    <>
                        <TechHero count={products.length} />
                        <div className="tech-cats">
                            {tree.children.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`tech-cat${cat === category.id ? " tech-cat--active" : ""}`}
                                    onClick={() => setFilter({ cat: cat === category.id ? undefined : category.id })}
                                >
                                    <Icon name={productIcon(category.name, key)} size={22} />
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="with-sidebar">
                            <aside className="filters">
                                <div className="filters__head">
                                    <h2>{t("listing.filters")}</h2>
                                    <button type="button" className="link-btn" onClick={() => setParams({}, { replace: true })}>{t("listing.clear")}</button>
                                </div>
                                <PriceFilter key={`${min}-${max}`} min={min} max={max} onApply={(from, to) => setFilter({ min: from, max: to })} />
                            </aside>
                            <div>
                                {toolbar}
                                {grid("tech", "grid--3")}
                            </div>
                        </div>
                    </>
                )}

                {key === "fashion" && (
                    <>
                        <FashionHero />
                        <div className="fashion-bar">
                            <CategoryTabs variant="tabs" categories={tree.children} value={cat} onChange={(id) => setFilter({ cat: id })} />
                            <SortSelect value={sort} onChange={(value) => setFilter({ sort: value })} />
                        </div>
                        <div className="section-head">
                            <h2 className="section-title">{t("home.newArrivals")}</h2>
                            <span className="latin accent-text">{t("listing.results", { count: products.length })}</span>
                        </div>
                        {grid("fashion", "grid--4")}
                        <div className="fashion-band">
                            <span className="fashion-band__line" />
                            <p className="display">{t("fashion.band")}</p>
                            <p className="latin accent-text">{t("fashion.band.latin")}</p>
                        </div>
                    </>
                )}

                {key === "food" && (
                    <>
                        <FoodHero />
                        <div className="food-cats">
                            {tree.children.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`food-cat${cat === category.id ? " food-cat--active" : ""}`}
                                    onClick={() => setFilter({ cat: cat === category.id ? undefined : category.id })}
                                >
                                    <span className="food-cat__icon"><Icon name={productIcon(category.name, key)} size={24} /></span>
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="with-basket">
                            <div>
                                {toolbar}
                                {grid("market", "grid--3")}
                            </div>
                            <MarketBasket />
                        </div>
                    </>
                )}

                {key === "books" && <BooksContent tree={tree} products={products} state={{ error, loading, reload, ready: Boolean(data) }} />}
            </div>
        </div>
    );
}

function BooksContent({ tree, products, state }: {
    tree: WorldTree;
    products: Product[];
    state: { error: unknown; loading: boolean; reload: () => void; ready: boolean };
}) {
    const { t, formatMoney } = usePreferences();

    const books = products.filter((product) => productIcon(product.name, "books") === "book");
    const supplies = products.filter((product) => productIcon(product.name, "books") !== "book");

    return (
        <>
            <BooksHero books={books} />

            {state.error ? <ErrorView error={state.error} onRetry={state.reload} /> : !state.ready ? <Loading /> : (
                <>
                    {books.length > 0 && (
                        <section className="section">
                            <div className="section-head section-head--ruled">
                                <h2 className="section-title">{t("books.classics")}</h2>
                                <span className="muted">{tree.children.length > 0 && t("listing.results", { count: books.length })}</span>
                            </div>
                            <div className="grid grid--6">
                                {books.map((book, index) => <ProductCard key={book.id} product={book} style="book" index={index} />)}
                            </div>
                        </section>
                    )}

                    {supplies.length > 0 && (
                        <section className="section">
                            <h2 className="section-title">{t("books.stationery")}</h2>
                            <ul className="supplies">
                                {supplies.map((item) => (
                                    <li key={item.id}>
                                        <Link to={`/product/${item.id}`} className="supplies__item">
                                            <span className="supplies__icon">
                                                <ProductImage
                                                    key={primaryImage(item)}
                                                    src={primaryImage(item)}
                                                    alt=""
                                                    className="supplies__img"
                                                    fallback={<Icon name={productIcon(item.name, "books")} size={24} />}
                                                />
                                            </span>
                                            <span className="supplies__name">
                                                <strong>{item.name}</strong>
                                                <small>{item.brand}</small>
                                            </span>
                                            <span className="price">{formatMoney(item.variants?.[0]?.price ?? item.price)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {products.length === 0 && <Empty icon="book" title={t("listing.empty")} />}
                </>
            )}
        </>
    );
}
