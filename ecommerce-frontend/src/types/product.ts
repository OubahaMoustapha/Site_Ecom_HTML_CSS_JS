export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number | string;
    stock: number;
    is_active: boolean;
    image: string | null;
    category_id: number | null;
    category: unknown;
    brand_id: number | null;
    brand: unknown;
    meta_title: string | null;
    meta_description: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    links: unknown;
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        [key: string]: unknown;
    };
}