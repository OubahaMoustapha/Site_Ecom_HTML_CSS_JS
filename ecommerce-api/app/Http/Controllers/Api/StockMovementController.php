<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateStockMovementRequest;
use App\Http\Resources\StockMovementResource;
use App\Models\StockMovement;
use App\Services\InventoryService;

class StockMovementController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {
    }

    /**
     * Display a listing of stock movements.
     */
    public function index()
    {
        $movements = StockMovement::with('productVariant')
            ->latest()
            ->paginate(10);

        return StockMovementResource::collection($movements);
    }

    /**
     * Store a newly created stock movement.
     */
    public function store(CreateStockMovementRequest $request)
    {
        $validated = $request->validated();

        $movement = $this->inventoryService->createMovement(
            $validated['product_variant_id'],
            $validated['type'],
            $validated['quantity'],
            $validated['note'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Stock movement created successfully.',
            'data' => new StockMovementResource($movement),
        ], 201);
    }

    /**
     * Display the specified stock movement.
     */
    public function show(StockMovement $stockMovement)
    {
        $stockMovement->load('productVariant');

        return new StockMovementResource($stockMovement);
    }
}