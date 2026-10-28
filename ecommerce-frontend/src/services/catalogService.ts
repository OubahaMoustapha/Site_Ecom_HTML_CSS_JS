// Catalogue management (admin). Every call maps to an existing API route;
// see ecommerce-api/routes/api.php and API_DOCUMENTATION.md §7.2–7.3.
import apiClient from "./apiClient";
import { getAllPages } from "./productService";

export { getAllBrands } from "./productService";
import type {
    Attribute,
    AttributeValue,
    Brand,
    Category,
    Inventory,
    Paginated,
    Product,
    ProductImage,
    ProductVariant,
    Wrapped,
} from "../types/api";

async function unwrap<T>(request: Promise<Wrapped<T>>) {
    return (await request).data;
}

/* ---------------------------------------------------------------- Products */

export interface ProductPayload {
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    is_active: boolean;
    category_id: number | null;
    brand_id: number | null;
    meta_title: string | null;
    meta_description: string | null;
}

export interface AdminProductQuery {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
    brand_id?: number;
    /** Admins may list inactive products too; omit for all. */
    is_active?: boolean;
    sort?: string;
}

export function getAdminProductsPage(query: AdminProductQuery) {
    return apiClient<Paginated<Product>>({ endpoint: "/products", query: { ...query } });
}

export function createProduct(payload: ProductPayload) {
    return unwrap(apiClient<Wrapped<Product>>({ endpoint: "/products", method: "POST", body: payload }));
}

export function updateProduct(id: number, payload: ProductPayload) {
    return unwrap(apiClient<Wrapped<Product>>({ endpoint: `/products/${id}`, method: "PUT", body: payload }));
}

/** 409 when the product has already been ordered: deactivate it instead. */
export function deleteProduct(id: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/products/${id}`, method: "DELETE" });
}

/* ---------------------------------------------------------------- Images */

export function uploadProductImage(productId: number, file: File, isPrimary: boolean) {
    const body = new FormData();
    body.append("image", file);
    body.append("is_primary", isPrimary ? "1" : "0");

    return unwrap(apiClient<Wrapped<ProductImage>>({ endpoint: `/products/${productId}/images`, method: "POST", body }));
}

export function deleteProductImage(productId: number, imageId: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/products/${productId}/images/${imageId}`, method: "DELETE" });
}

/* ---------------------------------------------------------------- Variants and stock */

export interface VariantPayload {
    product_id: number;
    sku: string;
    price: number;
    barcode: string | null;
    weight: number | null;
    is_active: boolean;
    attribute_values: number[];
}

export function createVariant(payload: VariantPayload) {
    return unwrap(apiClient<Wrapped<ProductVariant>>({ endpoint: "/product-variants", method: "POST", body: payload }));
}

export function updateVariant(id: number, payload: Partial<VariantPayload>) {
    return unwrap(apiClient<Wrapped<ProductVariant>>({ endpoint: `/product-variants/${id}`, method: "PUT", body: payload }));
}

/** 409 when the variant has already been ordered. */
export function deleteVariant(id: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/product-variants/${id}`, method: "DELETE" });
}

/** A new variant has no stock record yet: the API expects one per variant. */
export function createInventory(productVariantId: number, quantity: number, lowStockThreshold: number) {
    return unwrap(apiClient<Wrapped<Inventory>>({
        endpoint: "/inventories",
        method: "POST",
        body: { product_variant_id: productVariantId, quantity, low_stock_threshold: lowStockThreshold },
    }));
}

/* ---------------------------------------------------------------- Categories */

export interface CategoryPayload {
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    is_active: boolean;
}

export function createCategory(payload: CategoryPayload) {
    return unwrap(apiClient<Wrapped<Category>>({ endpoint: "/categories", method: "POST", body: payload }));
}

export function updateCategory(id: number, payload: CategoryPayload) {
    return unwrap(apiClient<Wrapped<Category>>({ endpoint: `/categories/${id}`, method: "PUT", body: payload }));
}

export function deleteCategory(id: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/categories/${id}`, method: "DELETE" });
}

/* ---------------------------------------------------------------- Brands */

export interface BrandPayload {
    name: string;
    slug: string;
    description: string | null;
    website: string | null;
    is_active: boolean;
}

export function createBrand(payload: BrandPayload) {
    return unwrap(apiClient<Wrapped<Brand>>({ endpoint: "/brands", method: "POST", body: payload }));
}

export function updateBrand(id: number, payload: BrandPayload) {
    return unwrap(apiClient<Wrapped<Brand>>({ endpoint: `/brands/${id}`, method: "PUT", body: payload }));
}

export function deleteBrand(id: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/brands/${id}`, method: "DELETE" });
}

/* ---------------------------------------------------------------- Attributes and values */

export interface AttributePayload {
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
}

export function getAllAttributes() {
    return getAllPages((page) => apiClient<Paginated<Attribute>>({ endpoint: "/attributes", query: { page } }));
}

export function createAttribute(payload: AttributePayload) {
    return unwrap(apiClient<Wrapped<Attribute>>({ endpoint: "/attributes", method: "POST", body: payload }));
}

export function updateAttribute(id: number, payload: AttributePayload) {
    return unwrap(apiClient<Wrapped<Attribute>>({ endpoint: `/attributes/${id}`, method: "PUT", body: payload }));
}

/** Also removes its values and their links to variants (cascade in the database). */
export function deleteAttribute(id: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/attributes/${id}`, method: "DELETE" });
}

export function getAllAttributeValues() {
    return getAllPages((page) => apiClient<Paginated<AttributeValue>>({ endpoint: "/attribute-values", query: { page } }));
}

export function createAttributeValue(attributeId: number, value: string) {
    return unwrap(apiClient<Wrapped<AttributeValue>>({
        endpoint: "/attribute-values",
        method: "POST",
        body: { attribute_id: attributeId, value, is_active: true },
    }));
}

export function updateAttributeValue(id: number, value: string, isActive: boolean) {
    return unwrap(apiClient<Wrapped<AttributeValue>>({
        endpoint: `/attribute-values/${id}`,
        method: "PUT",
        body: { value, is_active: isActive },
    }));
}

export function deleteAttributeValue(id: number) {
    return apiClient<Wrapped<null>>({ endpoint: `/attribute-values/${id}`, method: "DELETE" });
}

/* ---------------------------------------------------------------- Helpers */

/** URL-safe slug; Arabic letters are kept (Laravel accepts any string up to 255). */
export function slugify(text: string) {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 200);
}
