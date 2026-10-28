import { createContext, useContext } from "react";
import type { Cart } from "../types/api";

export interface CartValue {
    cart: Cart | null;
    loading: boolean;
    /** False while the saved session is still being restored: buying waits for it. */
    ready: boolean;
    add: (variantId: number, quantity?: number) => Promise<boolean>;
    update: (itemId: number, quantity: number) => Promise<void>;
    remove: (itemId: number) => Promise<void>;
    clear: () => Promise<void>;
    refresh: () => Promise<void>;
    quantityOf: (variantId: number) => number;
}

export const CartContext = createContext<CartValue | null>(null);

export function useCart() {
    const value = useContext(CartContext);

    if (!value) {
        throw new Error("useCart must be used inside CartProvider");
    }

    return value;
}
