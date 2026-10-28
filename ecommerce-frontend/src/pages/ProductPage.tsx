import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import Icon from "../components/icons";
import ProductImage from "../components/ProductImage";
import QtyStepper from "../components/QtyStepper";
import { Async, Empty } from "../components/StateViews";
import { useCart } from "../context/cart";
import { usePreferences } from "../context/preferences";
import { useWishlist } from "../context/wishlist";
import { useWorlds } from "../context/worlds";
import { useAsync } from "../hooks/useAsync";
import { productIcon } from "../lib/productIcon";
import { defaultVariant, primaryImage, purchasable, variantLabel } from "../lib/variants";
import { worldName } from "../lib/worlds";
import { ApiRequestError } from "../services/apiClient";
import { getProduct } from "../services/productService";
import type { Product } from "../types/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function ProductPage() {
    const { id = "" } = useParams();
    const { t } = usePreferences();
    const result = useAsync(useCallback(() => getProduct(id), [id]));

    if (result.error instanceof ApiRequestError && result.error.status === 404) {
        return <div className="container section"><Empty icon="search" title={t("product.notFound")} /></div>;
    }

    return (
        <div className="container section">
            <Async {...result}>
                {(product) => <ProductDetails key={product.id} product={product} />}
            </Async>
        </div>
    );
}

function ProductDetails({ product }: { product: Product }) {
    const { t, formatMoney } = usePreferences();
    const { worldOf } = useWorlds();
    const { add, ready } = useCart();
    const wishlist = useWishlist();
    useDocumentTitle(product.meta_title || product.name, product.meta_description || product.description);

    const variants = (product.variants ?? []).filter((variant) => variant.is_active);
    const [selectedId, setSelectedId] = useState(defaultVariant(product)?.id);
    const [quantity, setQuantity] = useState(1);
    const [imageIndex, setImageIndex] = useState(0);

    const selected = variants.find((variant) => variant.id === selectedId);
    const world = worldOf(product.category_id);
    const stock = selected?.stock ?? 0;
    const canBuy = selected ? purchasable(selected) : false;
    const images = product.images ?? [];
    const image = images[imageIndex]?.url ?? primaryImage(product);
    const liked = wishlist.has(product.id);

    return (
        <div className="product" data-world={world ?? undefined}>
            <nav className="breadcrumbs" aria-label="breadcrumb">
                <Link to="/">{t("nav.home")}</Link>
                {world && <><span aria-hidden="true">/</span><Link to={`/world/${world}`}>{t(worldName(world))}</Link></>}
                {product.category && <><span aria-hidden="true">/</span><span>{product.category}</span></>}
            </nav>

            <div className="product__layout">
                <div className="product__gallery">
                    <div className="product__media">
                        {/* Blurred copy of the photo fills the frame around images of any shape. */}
                        {image && <img src={image} alt="" aria-hidden="true" className="product__backdrop" />}
                        <ProductImage
                            key={image}
                            src={image}
                            alt={product.name}
                            fallback={<Icon name={productIcon([product.name, product.category], world)} size={120} strokeWidth={1.2} />}
                        />
                    </div>
                    {images.length > 1 && (
                        <div className="product__thumbs">
                            {images.map((item, index) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={index === imageIndex ? "is-active" : ""}
                                    onClick={() => setImageIndex(index)}
                                    aria-label={`${product.name} ${index + 1}`}
                                >
                                    <img src={item.url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="product__info">
                    {product.brand && <p className="kicker">{product.brand}</p>}
                    <h1 className="product__title">{product.name}</h1>
                    <p className="product__price">{formatMoney(selected?.price ?? product.price)}</p>

                    {variants.length > 1 && (
                        <fieldset className="product__options">
                            <legend>{t("product.chooseOption")}</legend>
                            <div className="chips chips--wrap">
                                {variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        type="button"
                                        aria-pressed={variant.id === selectedId}
                                        className={`chip chip--lg${variant.id === selectedId ? " chip--active" : ""}`}
                                        disabled={!purchasable(variant)}
                                        onClick={() => {
                                            setSelectedId(variant.id);
                                            setQuantity(1);
                                        }}
                                    >
                                        {variantLabel(variant)}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <p className={`stock${canBuy ? (stock <= 5 ? " stock--low" : " stock--ok") : " stock--out"}`}>
                        {!selected
                            ? t("product.unavailable")
                            : canBuy
                                ? (stock <= 5 ? t("product.lowStock", { count: stock }) : t("product.inStock", { count: stock }))
                                : t("product.outOfStock")}
                    </p>

                    <div className="product__buy">
                        <QtyStepper value={quantity} min={1} max={Math.max(1, stock)} onChange={setQuantity} />
                        <button
                            type="button"
                            className="btn btn--primary btn--lg"
                            disabled={!canBuy || !ready}
                            onClick={() => selected && add(selected.id, quantity)}
                        >
                            <Icon name="cart" size={18} /> {t("product.addToCart")}
                        </button>
                        <button
                            type="button"
                            className={`icon-btn icon-btn--lg${liked ? " icon-btn--on" : ""}`}
                            onClick={() => wishlist.toggle(product.id)}
                            aria-pressed={liked}
                            aria-label={liked ? t("product.wishlistRemove") : t("product.wishlistAdd")}
                        >
                            <Icon name="heart" filled={liked} />
                        </button>
                    </div>

                    {product.description && (
                        <section className="product__section">
                            <h2>{t("product.description")}</h2>
                            <p>{product.description}</p>
                        </section>
                    )}

                    <section className="product__section">
                        <h2>{t("product.details")}</h2>
                        <dl className="specs">
                            {selected && <><dt>{t("product.sku")}</dt><dd className="mono">{selected.sku}</dd></>}
                            {product.brand && <><dt>{t("product.brand")}</dt><dd>{product.brand}</dd></>}
                            {product.category && <><dt>{t("product.category")}</dt><dd>{product.category}</dd></>}
                            {selected?.attribute_values?.map((value) => (
                                <div key={value.id} className="specs__pair"><dt>{value.attribute}</dt><dd>{value.value}</dd></div>
                            ))}
                        </dl>
                    </section>
                </div>
            </div>
        </div>
    );
}
