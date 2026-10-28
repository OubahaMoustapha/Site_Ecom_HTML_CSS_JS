import { useCallback, useMemo, useState, type ReactNode } from "react";
import { WishlistContext } from "./wishlist";

// The API has no wishlist endpoint, so favourites live in this browser only.
const KEY = "durra.wishlist";

function readIds(): number[] {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
    } catch {
        return [];
    }
}

export default function WishlistProvider({ children }: { children: ReactNode }) {
    const [ids, setIds] = useState<number[]>(readIds);

    const toggle = useCallback((productId: number) => {
        setIds((current) => {
            const next = current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId];

            try {
                localStorage.setItem(KEY, JSON.stringify(next));
            } catch {
                // Favourites then last for the session only.
            }

            return next;
        });
    }, []);

    const value = useMemo(
        () => ({ ids, has: (productId: number) => ids.includes(productId), toggle }),
        [ids, toggle]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
