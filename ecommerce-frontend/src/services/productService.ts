import apiClient from "./apiClient";

export function getProducts(query?: Record<string, unknown>) {
    return apiClient({
        endpoint: "/products",
        query,
    });
}