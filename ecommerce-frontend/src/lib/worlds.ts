import type { TranslationKey } from "../i18n/dictionaries";
import { getAllCategories, getProducts, type ProductQuery } from "../services/productService";
import type { Category, Product } from "../types/api";
import type { IconName } from "../components/icons";

export type WorldKey = "electronics" | "fashion" | "food" | "books";

export interface World {
    key: WorldKey;
    /** Slug of the parent category in the API (created by WorldsSeeder). */
    slug: string;
    icon: IconName;
    dot: string;
}

export const WORLDS: World[] = [
    { key: "electronics", slug: "world-electronics", icon: "phone", dot: "#2F7BFF" },
    { key: "fashion", slug: "world-fashion", icon: "bag", dot: "#A11A32" },
    { key: "food", slug: "world-food", icon: "tomato", dot: "#E34530" },
    { key: "books", slug: "world-books", icon: "book", dot: "#1E3A2F" },
];

export function worldName(key: WorldKey): TranslationKey {
    return `world.${key}`;
}

export function isWorldKey(value: string | undefined): value is WorldKey {
    return WORLDS.some((world) => world.key === value);
}

export interface WorldTree {
    world: World;
    parent: Category | null;
    children: Category[];
}

let categoriesPromise: Promise<Category[]> | null = null;

/** Drops the cached categories, e.g. after the admin edits them. */
export function invalidateCategories() {
    categoriesPromise = null;
}

/** Categories rarely change during a visit, so they are fetched once and cached. */
export function loadCategories() {
    categoriesPromise ??= getAllCategories().catch((error: unknown) => {
        categoriesPromise = null;
        throw error;
    });

    return categoriesPromise;
}

export async function loadWorldTrees(): Promise<WorldTree[]> {
    const categories = await loadCategories();

    return WORLDS.map((world) => {
        const parent = categories.find((category) => category.slug === world.slug) ?? null;

        return {
            world,
            parent,
            children: parent ? categories.filter((category) => category.parent_id === parent.id) : [],
        };
    });
}

/** Finds which world a category belongs to (the category itself or its parent). */
export function worldOfCategory(trees: WorldTree[], categoryId: number | null): WorldKey | null {
    if (categoryId === null) {
        return null;
    }

    const tree = trees.find(
        (entry) => entry.parent?.id === categoryId || entry.children.some((child) => child.id === categoryId)
    );

    return tree?.world.key ?? null;
}

export type SortKey = "newest" | "price" | "-price" | "name";

/** UI sort keys → the API "sort" parameter. */
export const API_SORT: Record<SortKey, string> = {
    newest: "-created_at",
    price: "price",
    "-price": "-price",
    name: "name",
};

export const WORLD_PAGE_SIZE = 48;

/**
 * Products of a world in one request: filtering by the parent category
 * also matches its sub-categories, and the listing includes variants.
 */
export async function loadWorldProducts(
    tree: WorldTree,
    query: Omit<ProductQuery, "category_id" | "sort" | "per_page"> = {},
    sort: SortKey = "newest",
    categoryId?: number
): Promise<Product[]> {
    const id = categoryId ?? tree.parent?.id;

    if (!id) {
        return [];
    }

    const page = await getProducts({ ...query, category_id: id, sort: API_SORT[sort], per_page: WORLD_PAGE_SIZE });
    return page.data;
}
