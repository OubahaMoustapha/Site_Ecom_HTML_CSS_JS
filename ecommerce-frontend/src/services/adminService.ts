import apiClient from "./apiClient";
import { getAllPages } from "./productService";
import type { Inventory, Order, OrderStatus, Paginated, StockMovement, Wrapped } from "../types/api";

export function getAdminOrdersPage(page = 1, status?: OrderStatus) {
    return apiClient<Paginated<Order>>({
        endpoint: "/admin/orders",
        query: { page, status },
    });
}

export function getAllAdminOrders() {
    return getAllPages((page) => getAdminOrdersPage(page));
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
    return (await apiClient<Wrapped<Order>>({
        endpoint: `/admin/orders/${id}/status`,
        method: "PATCH",
        body: { status },
    })).data;
}

export function getLowStock() {
    return apiClient<Paginated<Inventory>>({ endpoint: "/inventories/low-stock" });
}

export function getInventoriesPage(page = 1) {
    return apiClient<Paginated<Inventory>>({ endpoint: "/inventories", query: { page } });
}

export function getStockMovementsPage(page = 1) {
    return apiClient<Paginated<StockMovement>>({ endpoint: "/stock-movements", query: { page } });
}

export async function createStockMovement(
    product_variant_id: number,
    type: StockMovement["type"],
    quantity: number,
    note?: string
) {
    return (await apiClient<Wrapped<StockMovement>>({
        endpoint: "/stock-movements",
        method: "POST",
        body: { product_variant_id, type, quantity, note },
    })).data;
}

export async function getAdminOrder(id: number | string) {
    return (await apiClient<Wrapped<Order>>({ endpoint: `/admin/orders/${id}` })).data;
}
