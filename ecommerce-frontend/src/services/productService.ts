import apiClient from "./apiClient";
import type { Brand, Category, Paginated, Product, ProductVariant, Wrapped } from "../types/api";

export interface ProductQuery {
    search?: string;
    category_id?: number;
    brand_id?: number;
    min_price?: number;
    max_price?: number;
    is_active?: boolean;
    sort?: string;
    page?: number;
    per_page?: number;
}

export function getProducts(query?: ProductQuery) {
    return apiClient<Paginated<Product>>({
        endpoint: "/products",
        query: query as Record<string, unknown>,
    });
}

export async function getProduct(id: number | string) {
    const response = await apiClient<Wrapped<Product>>({ endpoint: `/products/${id}` });
    return response.data;
}

export function getVariants(productId: number) {
    return apiClient<Paginated<ProductVariant>>({
        endpoint: "/product-variants",
        query: { product_id: productId },
    });
}

/**
 * Fetches every page of a paginated endpoint (capped to protect the API).
 */
export async function getAllPages<T>(
    fetchPage: (page: number) => Promise<Paginated<T>>,
    maxPages = 20
): Promise<T[]> {
    const first = await fetchPage(1);
    const lastPage = Math.min(first.meta.last_page, maxPages);

    const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, index) => fetchPage(index + 2))
    );

    return [first, ...rest].flatMap((page) => page.data);
}

export function getAllCategories() {
    return getAllPages((page) =>
        // The API allows 100 per page, so the whole tree normally arrives in one request.
        apiClient<Paginated<Category>>({ endpoint: "/categories", query: { page, per_page: 100 } })
    );
}

export function getAllBrands() {
    return getAllPages((page) => apiClient<Paginated<Brand>>({ endpoint: "/brands", query: { page } }));
}
