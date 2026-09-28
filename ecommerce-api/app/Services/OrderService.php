<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Get authenticated user's orders.
     */
    public function getOrders(User $user)
    {
        return $user->orders()
            ->with([
                'items.productVariant',
            ])
            ->latest()
            ->get();
    }

    /**
     * Get single order.
     */
    public function getOrder(
        User $user,
        Order $order
    ): Order {

        if ($order->user_id !== $user->id) {

            throw ValidationException::withMessages([
                'order' => [
                    'You are not authorized to access this order.',
                ],
            ]);

        }

        return $order->load([
            'items.productVariant',
        ]);
    }

    /**
     * Create order from cart.
     */
    public function createOrder(User $user): Order
    {
        $cart = $user->cart()
            ->with([
                'items.productVariant.product',
                'items.productVariant.inventory',
            ])
            ->first();

        if (! $cart || $cart->items->isEmpty()) {

            throw ValidationException::withMessages([
                'cart' => [
                    'Your cart is empty.',
                ],
            ]);

        }

        return DB::transaction(function () use ($user, $cart) {

            $subtotal = 0;

            /*
            |--------------------------------------------------------------------------
            | Validate inventory and calculate subtotal
            |--------------------------------------------------------------------------
            */

            foreach ($cart->items as $item) {

                $inventory = $item->productVariant->inventory;

                if (! $inventory) {

                    throw ValidationException::withMessages([
                        'inventory' => [
                            "Inventory record not found for SKU {$item->productVariant->sku}.",
                        ],
                    ]);

                }

                if ($item->quantity > $inventory->quantity) {

                    throw ValidationException::withMessages([
                        'quantity' => [
                            "Only {$inventory->quantity} item(s) available for {$item->productVariant->sku}.",
                        ],
                    ]);

                }

                $subtotal +=
                    $item->productVariant->price * $item->quantity;
            }

            /*
            |--------------------------------------------------------------------------
            | Create Order
            |--------------------------------------------------------------------------
            */

            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Create Order Items & Decrease Inventory
            |--------------------------------------------------------------------------
            */

            foreach ($cart->items as $item) {

                $variant = $item->productVariant;

                $order->items()->create([

                    'product_variant_id' => $variant->id,

                    'product_name' => $variant->product->name,

                    'sku' => $variant->sku,

                    'price' => $variant->price,

                    'quantity' => $item->quantity,

                    'subtotal' => $variant->price * $item->quantity,

                ]);

                $variant->inventory->decrement(
                    'quantity',
                    $item->quantity
                );

                $variant->stockMovements()->create([

                    'type' => 'out',

                    'quantity' => $item->quantity,

                    'reason' => 'Customer order',

                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Clear Cart
            |--------------------------------------------------------------------------
            */

            $cart->items()->delete();

            /*
            |--------------------------------------------------------------------------
            | Return Order
            |--------------------------------------------------------------------------
            */

            return $order->load([
                'items',
            ]);
        });
    }
}