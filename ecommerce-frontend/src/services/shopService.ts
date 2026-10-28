import apiClient from "./apiClient";
import type { Cart, Order, Payment, Wrapped } from "../types/api";

/*
|--------------------------------------------------------------------------
| Cart
|--------------------------------------------------------------------------
*/

export async function getCart() {
    return (await apiClient<Wrapped<Cart>>({ endpoint: "/cart" })).data;
}

export async function addToCart(product_variant_id: number, quantity: number) {
    return (await apiClient<Wrapped<Cart>>({
        endpoint: "/cart",
        method: "POST",
        body: { product_variant_id, quantity },
    })).data;
}

export async function updateCartItem(cartItemId: number, quantity: number) {
    return (await apiClient<Wrapped<Cart>>({
        endpoint: `/cart/items/${cartItemId}`,
        method: "PATCH",
        body: { quantity },
    })).data;
}

export async function removeCartItem(cartItemId: number) {
    return (await apiClient<Wrapped<Cart>>({
        endpoint: `/cart/items/${cartItemId}`,
        method: "DELETE",
    })).data;
}

export function clearCart() {
    return apiClient<Wrapped<null>>({ endpoint: "/cart", method: "DELETE" });
}

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/

export interface ShippingDetails {
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code?: string;
    shipping_country: string;
    notes?: string;
}

export async function getOrders() {
    return (await apiClient<Wrapped<Order[]>>({ endpoint: "/orders" })).data;
}

export async function getOrder(id: number | string) {
    return (await apiClient<Wrapped<Order>>({ endpoint: `/orders/${id}` })).data;
}

export async function createOrder(details: ShippingDetails) {
    return (await apiClient<Wrapped<Order>>({
        endpoint: "/orders",
        method: "POST",
        body: details,
    })).data;
}

export async function cancelOrder(id: number) {
    return (await apiClient<Wrapped<Order>>({
        endpoint: `/orders/${id}/cancel`,
        method: "POST",
    })).data;
}

export function downloadInvoice(id: number) {
    return apiClient<Blob>({ endpoint: `/orders/${id}/invoice`, responseType: "blob" });
}

/*
|--------------------------------------------------------------------------
| Payments
|--------------------------------------------------------------------------
*/

export type PaymentMethod = Payment["method"];

export async function payOrder(order_id: number, method: PaymentMethod) {
    return (await apiClient<Wrapped<Payment>>({
        endpoint: "/payments",
        method: "POST",
        body: { order_id, method },
    })).data;
}
