<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\InvoiceService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly InvoiceService $invoiceService
    ) {
    }

    /**
     * Display authenticated user's orders.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $orders = $this->orderService->getOrders($user);

        return response()->json([
            'success' => true,
            'data' => OrderResource::collection($orders),
        ]);
    }

    /**
     * Display a specific order.
     */
    public function show(
        Request $request,
        Order $order
    ): JsonResponse {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $this->orderService->getOrder(
            $user,
            $order
        );

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order),
        ]);
    }

    /**
     * Create a new order from cart.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $this->orderService->createOrder($user);

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully.',
            'data' => new OrderResource($order),
        ], 201);
    }

    /**
     * Download order invoice.
     */
    public function downloadInvoice(
        Request $request,
        Order $order
    ) {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $order = $this->orderService->getOrder(
            $user,
            $order
        );

        $pdf = $this->invoiceService->generate($order);

        return $pdf->download(
            "invoice-{$order->id}.pdf"
        );
    }
}