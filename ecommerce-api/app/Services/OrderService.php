<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\Order;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {
    }

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
    public function createOrder(User $user, array $data): Order
    {
        $cart = $user->cart()
            ->with([
                'items.productVariant.product',
            ])
            ->first();

        if (! $cart || $cart->items->isEmpty()) {

            throw ValidationException::withMessages([
                'cart' => [
                    'Your cart is empty.',
                ],
            ]);

        }

        return DB::transaction(function () use ($user, $cart, $data) {

            $subtotal = 0;

            /*
            |--------------------------------------------------------------------------
            | Lock inventory rows, validate stock and calculate subtotal
            |--------------------------------------------------------------------------
            */

            foreach ($cart->items as $item) {

                $variant = $item->productVariant;

                if (! $variant->is_active) {

                    throw ValidationException::withMessages([
                        'cart' => [
                            "Product variant {$variant->sku} is no longer available.",
                        ],
                    ]);

                }

                $inventory = Inventory::where('product_variant_id', $variant->id)
                    ->lockForUpdate()
                    ->first();

                if (! $inventory) {

                    throw ValidationException::withMessages([
                        'inventory' => [
                            "Inventory record not found for SKU {$variant->sku}.",
                        ],
                    ]);

                }

                if ($item->quantity > $inventory->quantity) {

                    throw ValidationException::withMessages([
                        'quantity' => [
                            "Only {$inventory->quantity} item(s) available for {$variant->sku}.",
                        ],
                    ]);

                }

                $subtotal += $variant->price * $item->quantity;
            }

            /*
            |--------------------------------------------------------------------------
            | Create Order
            |--------------------------------------------------------------------------
            */

            $order = Order::create([
                'user_id' => $user->id,
                'status' => Order::STATUS_PENDING,
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'shipping_name' => $data['shipping_name'],
                'shipping_phone' => $data['shipping_phone'],
                'shipping_address' => $data['shipping_address'],
                'shipping_city' => $data['shipping_city'],
                'shipping_postal_code' => $data['shipping_postal_code'] ?? null,
                'shipping_country' => $data['shipping_country'],
                'notes' => $data['notes'] ?? null,
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

                $this->inventoryService->createMovement(
                    $variant->id,
                    StockMovement::TYPE_OUT,
                    $item->quantity,
                    "Customer order #{$order->id}"
                );
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

    /**
     * Cancel an unpaid order owned by the user.
     */
    public function cancelOrder(User $user, Order $order): Order
    {
        $this->getOrder($user, $order);

        if ($order->status !== Order::STATUS_PENDING) {

            throw ValidationException::withMessages([
                'order' => [
                    'Only pending orders can be cancelled. Please contact support.',
                ],
            ]);

        }

        return $this->changeStatus($order, Order::STATUS_CANCELLED);
    }

    /**
     * Get all orders (admin).
     */
    public function getAllOrders(array $filters): LengthAwarePaginator
    {
        return Order::with([
                'user',
                'items',
                'payment',
            ])
            ->when(
                $filters['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->when(
                $filters['user_id'] ?? null,
                fn ($query, $userId) => $query->where('user_id', $userId)
            )
            ->latest()
            ->paginate(15);
    }

    /**
     * Update order status (admin).
     */
    public function updateStatus(Order $order, string $status): Order
    {
        return $this->changeStatus($order, $status)
            ->load([
                'user',
                'items',
                'payment',
            ]);
    }

    /**
     * Apply a status transition. Cancelling restores the stock
     * of every item and marks an existing payment as refunded.
     */
    private function changeStatus(Order $order, string $status): Order
    {
        return DB::transaction(function () use ($order, $status) {

            // Re-read the order under lock to prevent double transitions.
            $order = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $order->canTransitionTo($status)) {

                throw ValidationException::withMessages([
                    'status' => [
                        "Cannot change order status from {$order->status} to {$status}.",
                    ],
                ]);

            }

            if ($status === Order::STATUS_CANCELLED) {

                foreach ($order->items as $item) {

                    $this->inventoryService->createMovement(
                        $item->product_variant_id,
                        StockMovement::TYPE_IN,
                        $item->quantity,
                        "Order #{$order->id} cancelled"
                    );
                }

                $order->payment()->update([
                    'status' => 'refunded',
                ]);

                $order->cancelled_at = now();
            }

            $order->status = $status;

            $order->save();

            return $order->load('items');
        });
    }
}
