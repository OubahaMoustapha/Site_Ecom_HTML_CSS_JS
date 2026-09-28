<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService
    ) {
    }

    /**
     * Display authenticated user's payments.
     */
    public function index(Request $request): JsonResponse
    {
        $payments = $this->paymentService->getPayments(
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => PaymentResource::collection($payments),
        ]);
    }

    /**
     * Display a single payment.
     */
    public function show(
        Request $request,
        Payment $payment
    ): JsonResponse {

        $payment = $this->paymentService->getPayment(
            $request->user(),
            $payment
        );

        return response()->json([
            'success' => true,
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Pay an order.
     */
    public function store(
        PaymentRequest $request
    ): JsonResponse {

        $payment = $this->paymentService->pay(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment completed successfully.',
            'data' => new PaymentResource($payment),
        ], 201);
    }
}