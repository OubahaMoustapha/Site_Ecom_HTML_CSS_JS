// Shapes returned by the Laravel API (see ecommerce-api/app/Http/Resources).
// Decimal columns without a cast arrive as strings, hence `number | string`.

export type Money = number | string;

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    [key: string]: unknown;
}

export interface Paginated<T> {
    data: T[];
    links: unknown;
    meta: PaginationMeta;
}

export interface Wrapped<T> {
    success?: boolean;
    message?: string;
    data: T;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    parent_id: number | null;
    is_active: boolean;
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    website: string | null;
    is_active: boolean;
}

export interface Attribute {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    values_count?: number;
}

export interface ProductImage {
    id: number;
    product_id: number;
    image: string;
    url: string;
    is_primary: boolean;
}

export interface AttributeValue {
    id: number;
    attribute_id: number;
    attribute?: string;
    value: string;
    is_active: boolean;
}

export interface ProductVariant {
    id: number;
    product_id: number;
    product?: string;
    sku: string;
    price: number;
    barcode: string | null;
    weight: number | null;
    is_active: boolean;
    stock?: number;
    attribute_values?: AttributeValue[];
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    is_active: boolean;
    image: string | null;
    category_id: number | null;
    category: string | null;
    brand_id: number | null;
    brand: string | null;
    meta_title: string | null;
    meta_description: string | null;
    images?: ProductImage[];
    variants?: ProductVariant[];
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    role: "customer" | "admin";
    created_at: string;
}

export interface CartItem {
    id: number;
    quantity: number;
    variant_id: number;
    sku: string;
    price: Money;
    product_name: string;
    subtotal: number;
}

export interface Cart {
    id: number;
    items_count: number;
    total_quantity: number;
    total: number;
    items: CartItem[];
}

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "completed" | "cancelled";

export interface OrderItem {
    id: number;
    product_variant_id: number | null;
    product_name: string;
    sku: string;
    price: Money;
    quantity: number;
    subtotal: Money;
}

export interface Payment {
    id: number;
    order_id: number;
    amount: Money;
    method: "cash" | "card" | "paypal";
    status: "paid" | "refunded" | "pending";
    transaction_id: string | null;
    paid_at: string | null;
    created_at: string;
}

export interface Order {
    id: number;
    status: OrderStatus;
    subtotal: Money;
    total: Money;
    shipping: {
        name: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        postal_code: string | null;
        country: string | null;
    };
    notes: string | null;
    cancelled_at: string | null;
    created_at: string;
    user?: User;
    payment?: Payment | null;
    items_count: number;
    items: OrderItem[];
}

export interface Inventory {
    id: number;
    product_variant_id: number;
    variant?: { id: number; sku: string };
    quantity: number;
    low_stock_threshold: number;
}

export interface StockMovement {
    id: number;
    product_variant_id: number;
    variant?: { id: number; sku: string };
    type: "in" | "out" | "adjustment";
    quantity_before: number | null;
    quantity: number;
    note: string | null;
    created_at: string;
}

export interface AuthResult {
    user: User;
    token: string;
}
