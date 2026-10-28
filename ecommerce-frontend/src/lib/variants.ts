import type { Product, ProductVariant } from "../types/api";

export function purchasable(variant: ProductVariant) {
    return variant.is_active && (variant.stock ?? 0) > 0;
}

/** First variant that can be bought, otherwise the first active one. */
export function defaultVariant(product: Product): ProductVariant | undefined {
    const variants = product.variants ?? [];
    return variants.find(purchasable) ?? variants.find((variant) => variant.is_active);
}

/** Human label of a variant from its attribute values, e.g. "M" or "1kg". */
export function variantLabel(variant: ProductVariant): string {
    const values = variant.attribute_values?.map((value) => value.value) ?? [];
    return values.length ? values.join(" · ") : variant.sku;
}

/** Lowest price across active variants, falling back to the product price. */
export function displayPrice(product: Product): number {
    const prices = (product.variants ?? [])
        .filter((variant) => variant.is_active)
        .map((variant) => variant.price);

    return prices.length ? Math.min(...prices) : product.price;
}

export function primaryImage(product: Product): string | undefined {
    const images = product.images ?? [];
    return (images.find((image) => image.is_primary) ?? images[0])?.url;
}
