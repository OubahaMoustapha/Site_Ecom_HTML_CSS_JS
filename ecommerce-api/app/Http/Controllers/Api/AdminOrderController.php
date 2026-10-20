<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService
    ) {
    }

    /**
     * Display all orders, optionally filtered by status or user.
     */
    public function index(Request $request)
    {
        $orders = $this->orderService->getAllOrders(
            $request->only(['status', 'user_id'])
        );

        return OrderResource::collection($orders);
    }

    /**
     * Display any order.
     */
    public function show(Order $order): JsonResponse
    {
        $order->load([
            'user',
            'items',
            'payment',
        ]);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Update order status.
     */
    public function updateStatus(
        UpdateOrderStatusRequest $request,
        Order $order
    ): JsonResponse {

        $order = $this->orderService->updateStatus(
            $order,
            $request->validated()['status']
        );

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'data' => new OrderResource($order),
        ]);
    }
}
