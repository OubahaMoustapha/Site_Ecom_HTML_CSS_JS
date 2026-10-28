import { useCallback } from "react";
import CategoryOptions from "../components/CategoryOptions";
import { useSearchParams } from "react-router";
import ProductCard from "../components/ProductCard";
import { Async, Empty } from "../components/StateViews";
import { PriceFilter, SortSelect } from "../components/world/ListingControls";
import { usePreferences } from "../context/preferences";
import { useAsync } from "../hooks/useAsync";
import { API_SORT, loadCategories, type SortKey } from "../lib/worlds";
import { getAllBrands, getProducts } from "../services/productService";

async function loadFilters() {
    const [categories, brands] = await Promise.all([loadCategories(), getAllBrands()]);
    return { categories: categories.filter((category) => category.is_active), brands: brands.filter((brand) => brand.is_active) };
}
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function SearchPage() {
    const { t } = usePreferences();
    const [params, setParams] = useSearchParams();
    useDocumentTitle(params.get("q") || t("search.title"));

    const q = params.get("q") ?? "";
    const sortParam = params.get("sort") as SortKey | null;
    const sort: SortKey = sortParam && sortParam in API_SORT ? sortParam : "newest";
    const page = Math.max(1, Number(params.get("page")) || 1);
    const categoryId = Number(params.get("cat")) || undefined;
    const brandId = Number(params.get("brand")) || undefined;
    const min = Number(params.get("min")) || undefined;
    const max = Number(params.get("max")) || undefined;

    const loader = useCallback(async () => {
        const result = await getProducts({
            search: q || undefined,
            category_id: categoryId,
            brand_id: brandId,
            min_price: min,
            max_price: max,
            sort: API_SORT[sort],
            page,
            is_active: true,
            per_page: 12,
        });
        return { meta: result.meta, products: result.data };
    }, [q, categoryId, brandId, min, max, sort, page]);

    const result = useAsync(loader);
    const filters = useAsync(loadFilters);

    const go = (changes: Record<string, string | undefined>) => {
        const next = new URLSearchParams(params);

        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value); else next.delete(key);
        }

        setParams(next);
    };

    return (
        <section className="container section">
            <div className="section-head">
                <h1 className="section-title">{q ? t("listing.searchResults", { q }) : t("nav.newArrivals")}</h1>
                <SortSelect value={sort} onChange={(value) => go({ sort: value, page: undefined })} />
            </div>

            <div className="search-filters">
                <select value={categoryId ?? ""} onChange={(event) => go({ cat: event.target.value || undefined, page: undefined })} aria-label={t("search.category")}>
                    <option value="">{t("search.allCategories")}</option>
                    {filters.data && <CategoryOptions categories={filters.data.categories} />}
                </select>
                <select value={brandId ?? ""} onChange={(event) => go({ brand: event.target.value || undefined, page: undefined })} aria-label={t("search.brand")}>
                    <option value="">{t("search.allBrands")}</option>
                    {filters.data?.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
                <PriceFilter
                    key={`${min ?? ""}-${max ?? ""}`}
                    min={min}
                    max={max}
                    onApply={(from, to) => go({ min: from?.toString(), max: to?.toString(), page: undefined })}
                />
                {(categoryId || brandId || min || max) && (
                    <button type="button" className="link-btn" onClick={() => go({ cat: undefined, brand: undefined, min: undefined, max: undefined, page: undefined })}>
                        {t("search.clear")}
                    </button>
                )}
            </div>

            <Async {...result}>
                {({ meta, products }) => products.length === 0 ? (
                    <Empty icon="search" title={t("listing.empty")} />
                ) : (
                    <>
                        <p className="muted">{t("listing.results", { count: meta.total })}</p>
                        <div className={`grid grid--4${result.loading ? " is-refreshing" : ""}`}>
                            {products.map((product) => <ProductCard key={product.id} product={product} />)}
                        </div>
                        {meta.last_page > 1 && (
                            <nav className="pager" aria-label={t("listing.page", { page, total: meta.last_page })}>
                                <button type="button" className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>
                                    {t("listing.prev")}
                                </button>
                                <span>{t("listing.page", { page, total: meta.last_page })}</span>
                                <button type="button" className="btn btn--outline btn--sm" disabled={page >= meta.last_page} onClick={() => go({ page: String(page + 1) })}>
                                    {t("listing.next")}
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </Async>
        </section>
    );
}
