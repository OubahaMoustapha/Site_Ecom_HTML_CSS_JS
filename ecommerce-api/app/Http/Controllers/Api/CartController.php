<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddToCartRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService
    ) {
    }

    /**
     * Display authenticated user's cart.
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartService->getCart(
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Add product to cart.
     */
    public function store(AddToCartRequest $request): JsonResponse
    {
        $cart = $this->cartService->addToCart(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Product added to cart successfully.',
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Update cart item quantity.
     */
    public function update(
        UpdateCartItemRequest $request,
        CartItem $cartItem
    ): JsonResponse {

        $cart = $this->cartService->updateQuantity(
            $request->user(),
            $cartItem,
            $request->validated()['quantity']
        );

        return response()->json([
            'success' => true,
            'message' => 'Cart updated successfully.',
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Remove item from cart.
     */
    public function destroy(
        Request $request,
        CartItem $cartItem
    ): JsonResponse {

        $cart = $this->cartService->removeItem(
            $request->user(),
            $cartItem
        );

        return response()->json([
            'success' => true,
            'message' => 'Item removed successfully.',
            'data' => new CartResource($cart),
        ]);
    }

    /**
     * Clear authenticated user's cart.
     */
    public function clear(Request $request): JsonResponse
    {
        $this->cartService->clearCart(
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully.',
        ]);
    }
}