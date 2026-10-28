import type { ProductPayload } from "../services/catalogService";
import type { Category, Product } from "../types/api";

/** The four storefront worlds are parent categories with a "world-" slug. */
export const isWorldCategory = (category: Category) => category.slug.startsWith("world-");

/** Full payload rebuilt from a loaded product (the update endpoint replaces every field). */
export function payloadOf(product: Product): ProductPayload {
    return {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        stock: Number(product.stock) || 0,
        is_active: product.is_active,
        category_id: product.category_id,
        brand_id: product.brand_id,
        meta_title: product.meta_title,
        meta_description: product.meta_description,
    };
}
