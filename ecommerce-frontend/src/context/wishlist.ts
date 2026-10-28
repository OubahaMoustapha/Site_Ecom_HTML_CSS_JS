import { createContext, useContext } from "react";

export interface WishlistValue {
    ids: number[];
    has: (productId: number) => boolean;
    toggle: (productId: number) => void;
}

export const WishlistContext = createContext<WishlistValue | null>(null);

export function useWishlist() {
    const value = useContext(WishlistContext);

    if (!value) {
        throw new Error("useWishlist must be used inside WishlistProvider");
    }

    return value;
}
