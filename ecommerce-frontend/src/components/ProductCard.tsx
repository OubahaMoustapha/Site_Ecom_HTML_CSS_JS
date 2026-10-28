import { useState } from "react";
import { Link } from "react-router";
import { useCart } from "../context/cart";
import { usePreferences } from "../context/preferences";
import { useWishlist } from "../context/wishlist";
import { useWorlds } from "../context/worlds";
import { productIcon } from "../lib/productIcon";
import { defaultVariant, displayPrice, primaryImage, purchasable, variantLabel } from "../lib/variants";
import type { Product } from "../types/api";
import Icon from "./icons";
import ProductImage from "./ProductImage";
import QtyStepper from "./QtyStepper";

export type CardStyle = "default" | "tech" | "fashion" | "market" | "book";

interface Props {
    product: Product;
    style?: CardStyle;
    /** Used by book covers to rotate through the library palette. */
    index?: number;
}

export default function ProductCard({ product, style = "default", index = 0 }: Props) {
    const { t, formatMoney } = usePreferences();
    const { worldOf } = useWorlds();
    const { add, update, remove, cart, ready } = useCart();
    const wishlist = useWishlist();

    const variants = (product.variants ?? []).filter((variant) => variant.is_active);
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

    const selected = variants.find((variant) => variant.id === selectedId) ?? defaultVariant(product);
    const world = worldOf(product.category_id);
    const icon = productIcon([product.name, product.category], world);
    const price = selected?.price ?? displayPrice(product);
    const stock = selected?.stock ?? 0;
    const canBuy = selected ? purchasable(selected) : false;
    const cartItem = selected ? cart?.items.find((item) => item.variant_id === selected.id) : undefined;
    const liked = wishlist.has(product.id);
    const href = `/product/${product.id}`;
    const image = primaryImage(product);

    const addButton = (
        <button
            type="button"
            className={style === "book" ? "btn btn--outline btn--sm" : "btn btn--primary btn--sm"}
            disabled={!canBuy || !ready}
            onClick={() => selected && add(selected.id)}
            aria-label={`${t("product.addToCart")}: ${product.name}`}
        >
            {canBuy
                ? (style === "tech" || style === "default" ? t("product.addToCart") : (style === "book" ? t("product.add") : <Icon name="plus" size={18} />))
                : t("product.outOfStock")}
        </button>
    );

    const chips = variants.length > 1 && (
        <div className="chips" role="radiogroup" aria-label={t("product.chooseOption")}>
            {variants.map((variant) => (
                <button
                    key={variant.id}
                    type="button"
                    role="radio"
                    aria-checked={variant.id === selected?.id}
                    className={`chip${variant.id === selected?.id ? " chip--active" : ""}`}
                    disabled={!purchasable(variant)}
                    onClick={() => setSelectedId(variant.id)}
                >
                    {variantLabel(variant)}
                </button>
            ))}
        </div>
    );

    const heart = (
        <button
            type="button"
            className={`card__like${liked ? " card__like--on" : ""}`}
            onClick={() => wishlist.toggle(product.id)}
            aria-pressed={liked}
            aria-label={liked ? t("product.wishlistRemove") : t("product.wishlistAdd")}
        >
            <Icon name="heart" size={16} filled={liked} />
        </button>
    );

    if (style === "book") {
        return (
            <article className={`card card--book cover-${index % 4}`}>
                <Link to={href} className={`book-cover${image ? " book-cover--photo" : ""}`} aria-label={product.name}>
                    <ProductImage
                        key={image}
                        src={image}
                        alt=""
                        className="book-cover__img"
                        fallback={<>
                            <span className="book-cover__title">{product.name}</span>
                            {product.brand && <span className="book-cover__author">{product.brand}</span>}
                        </>}
                    />
                </Link>
                <div className="card__body">
                    <h3 className="card__title"><Link to={href}>{product.name}</Link></h3>
                    {product.brand && <p className="card__meta">{product.brand}</p>}
                    <div className="card__foot">
                        <span className="price">{formatMoney(price)}</span>
                        {addButton}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className={`card card--${style}`} data-world={world ?? undefined}>
            <div className="card__media">
                <Link to={href} className="card__media-link" tabIndex={-1} aria-hidden="true">
                    <ProductImage
                        key={image}
                        src={image}
                        alt=""
                        className="card__img"
                        fallback={<Icon name={icon} size={style === "fashion" ? 72 : 56} strokeWidth={1.4} />}
                    />
                </Link>
                {heart}
                {canBuy && stock <= 5 && <span className="badge badge--accent card__badge">{t("product.lowStock", { count: stock })}</span>}
            </div>

            <div className="card__body">
                {style !== "fashion" && product.category && (
                    <p className="card__meta">
                        {world && <span className="dot" data-world-dot={world} />}
                        {product.category}
                    </p>
                )}
                <h3 className="card__title"><Link to={href}>{product.name}</Link></h3>
                {style === "tech" && selected && <p className="card__specs">{selected.sku}{product.brand ? ` · ${product.brand}` : ""}</p>}
                {style === "market" && product.brand && <p className="card__meta">{product.brand}</p>}

                {chips}

                <div className="card__foot">
                    <span className="price">{formatMoney(price)}</span>

                    {style === "market" && cartItem ? (
                        <QtyStepper
                            value={cartItem.quantity}
                            max={stock}
                            onChange={(quantity) => quantity > 0 ? update(cartItem.id, quantity) : remove(cartItem.id)}
                        />
                    ) : addButton}
                </div>
            </div>
        </article>
    );
}
