import { useCallback } from "react";
import { Link } from "react-router";
import ProductCard from "../components/ProductCard";
import { Async, Empty } from "../components/StateViews";
import { usePreferences } from "../context/preferences";
import { useWishlist } from "../context/wishlist";
import { useAsync } from "../hooks/useAsync";
import { getProduct } from "../services/productService";
import type { Product } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function WishlistPage() {
    const { t } = usePreferences();
    useDocumentTitle(t("nav.wishlist"));
    const { ids } = useWishlist();
    const key = ids.join(",");

    // Products deleted since they were liked are skipped silently.
    const loader = useCallback(async () => {
        const results = await Promise.allSettled(key.split(",").filter(Boolean).map((id) => getProduct(id)));
        return results
            .filter((entry): entry is PromiseFulfilledResult<Product> => entry.status === "fulfilled")
            .map((entry) => entry.value);
    }, [key]);

    const result = useAsync(loader);

    return (
        <section className="container section">
            <h1 className="section-title">{t("nav.wishlist")}</h1>
            <Async {...result}>
                {(products) => products.length === 0 ? (
                    <Empty icon="heart" title={t("nav.wishlist")} action={<Link to="/worlds" className="btn btn--primary">{t("home.shopNow")}</Link>} />
                ) : (
                    <div className="grid grid--4">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}
            </Async>
        </section>
    );
}
