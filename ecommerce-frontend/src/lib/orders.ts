import type { OrderStatus } from "../types/api";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "completed", "cancelled"];

// Mirrors Order::STATUS_TRANSITIONS in the API (pending -> paid happens through payment).
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    pending: ["cancelled"],
    paid: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["completed"],
    completed: [],
    cancelled: [],
};
