import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ApiRequestError } from "../services/apiClient";
import * as shop from "../services/shopService";
import type { Cart } from "../types/api";
import { useAuth } from "./auth";
import { CartContext } from "./cart";
import { usePreferences } from "./preferences";
import { useToast } from "./toast";

function firstError(error: unknown, fallback: string) {
    if (error instanceof ApiRequestError) {
        const fieldMessage = error.errors && Object.values(error.errors)[0]?.[0];
        return fieldMessage ?? error.message;
    }

    return fallback;
}

export default function CartProvider({ children }: { children: ReactNode }) {
    const { user, status } = useAuth();
    const { t } = usePreferences();
    const { notify } = useToast();
    const navigate = useNavigate();

    // The cart belongs to a user; it is only meaningful while that user is logged in.
    const [state, setState] = useState<{ userId: number; cart: Cart } | null>(null);
    // A ref, not state: several clicks in the same tick must all see the request in flight.
    const adding = useRef(false);
    const ready = status !== "checking";

    const cart = user && state?.userId === user.id ? state.cart : null;
    const loading = Boolean(user) && !cart;

    const store = useCallback((next: Cart) => {
        if (user) {
            setState({ userId: user.id, cart: next });
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let active = true;

        shop.getCart()
            .then((next) => {
                if (active) {
                    setState({ userId: user.id, cart: next });
                }
            })
            .catch(() => {
                // A failed cart load leaves the badge empty; actions retry on demand.
            });

        return () => {
            active = false;
        };
    }, [user]);

    const refresh = useCallback(async () => {
        if (user) {
            store(await shop.getCart());
        }
    }, [user, store]);

    const add = useCallback(async (variantId: number, quantity = 1) => {
        if (!ready) {
            return false;
        }

        if (!user) {
            notify(t("product.loginToBuy"), "info");
            navigate("/login", { state: { from: window.location.pathname } });
            return false;
        }

        if (adding.current) {
            return false;
        }

        adding.current = true;

        try {
            store(await shop.addToCart(variantId, quantity));
            notify(t("product.added"));
            return true;
        } catch (error) {
            notify(firstError(error, t("common.error")), "error");
            return false;
        } finally {
            adding.current = false;
        }
    }, [ready, user, store, notify, t, navigate]);

    const update = useCallback(async (itemId: number, quantity: number) => {
        try {
            store(await shop.updateCartItem(itemId, quantity));
        } catch (error) {
            notify(firstError(error, t("common.error")), "error");
        }
    }, [store, notify, t]);

    const remove = useCallback(async (itemId: number) => {
        try {
            store(await shop.removeCartItem(itemId));
        } catch (error) {
            notify(firstError(error, t("common.error")), "error");
        }
    }, [store, notify, t]);

    const clear = useCallback(async () => {
        try {
            await shop.clearCart();
            await refresh();
        } catch (error) {
            notify(firstError(error, t("common.error")), "error");
        }
    }, [refresh, notify, t]);

    const quantityOf = useCallback(
        (variantId: number) => cart?.items.find((item) => item.variant_id === variantId)?.quantity ?? 0,
        [cart]
    );

    const value = useMemo(
        () => ({ cart, loading, ready, add, update, remove, clear, refresh, quantityOf }),
        [cart, loading, ready, add, update, remove, clear, refresh, quantityOf]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
