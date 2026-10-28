<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class CartService
{
    /**
     * Get authenticated user's cart.
     */
    public function getCart(User $user): Cart
    {
        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
        ]);

        return $cart->load([
            'items.productVariant.product',
        ]);
    }

    /**
     * Add product variant to cart.
     */
    public function addToCart(User $user, array $data): Cart
    {
        $cart = $this->getCart($user);

        $variant = ProductVariant::with(['inventory', 'product'])
            ->findOrFail($data['product_variant_id']);

        if (! $variant->is_active || ! $variant->product?->is_active) {

            throw ValidationException::withMessages([
                'product_variant_id' => [
                    'This product variant is not available.',
                ],
            ]);

        }

        if (! $variant->inventory) {

            throw ValidationException::withMessages([
                'product_variant_id' => [
                    'Inventory record not found.',
                ],
            ]);

        }

        $cartItem = $cart->items()
            ->where(
                'product_variant_id',
                $variant->id
            )
            ->first();

        $newQuantity = $cartItem
            ? $cartItem->quantity + $data['quantity']
            : $data['quantity'];

        if ($newQuantity > $variant->inventory->quantity) {

            throw ValidationException::withMessages([
                'quantity' => [
                    "Only {$variant->inventory->quantity} item(s) available in stock.",
                ],
            ]);

        }

        if ($cartItem) {

            $cartItem->update([
                'quantity' => $newQuantity,
            ]);

        } else {

            $cart->items()->create([
                'product_variant_id' => $variant->id,
                'quantity' => $data['quantity'],
            ]);

        }

        return $this->getCart($user);
    }

    /**
     * Update cart item quantity.
     */
    public function updateQuantity(
        User $user,
        CartItem $cartItem,
        int $quantity
    ): Cart {

        $cart = $this->getCart($user);

        if ($cartItem->cart_id !== $cart->id) {

            throw ValidationException::withMessages([
                'cart_item' => [
                    'This cart item does not belong to your cart.',
                ],
            ]);

        }

        $variant = ProductVariant::with('inventory')
            ->findOrFail($cartItem->product_variant_id);

        if (! $variant->inventory) {

            throw ValidationException::withMessages([
                'product_variant_id' => [
                    'Inventory record not found.',
                ],
            ]);

        }

        if ($quantity > $variant->inventory->quantity) {

            throw ValidationException::withMessages([
                'quantity' => [
                    "Only {$variant->inventory->quantity} item(s) available in stock.",
                ],
            ]);

        }

        $cartItem->update([
            'quantity' => $quantity,
        ]);

        return $this->getCart($user);
    }

    /**
     * Remove item from cart.
     */

    /**
     * Remove item from cart.
     */
    public function removeItem(
        User $user,
        CartItem $cartItem
    ): Cart {

        $cart = $this->getCart($user);

        if ($cartItem->cart_id !== $cart->id) {

            throw ValidationException::withMessages([
                'cart_item' => [
                    'This cart item does not belong to your cart.',
                ],
            ]);

        }

        $cartItem->delete();

        return $this->getCart($user);
    }

    /**
     * Clear cart.
     */
    public function clearCart(User $user): void
    {
        $cart = $this->getCart($user);

        $cart->items()->delete();
    }
}