<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateInventoryRequest;
use App\Http\Requests\UpdateInventoryRequest;
use App\Http\Resources\InventoryResource;
use App\Models\Inventory;
use App\Models\StockMovement;
use App\Services\InventoryService;

class InventoryController extends Controller
{
    /**
     * Display a listing of inventories.
     */
    public function index()
    {
        $inventories = Inventory::with('productVariant')
            ->latest()
            ->paginate(10);

        return InventoryResource::collection($inventories);
    }

    /**
     * Store a newly created inventory.
     */
    public function store(CreateInventoryRequest $request)
    {
        $inventory = Inventory::create($request->validated());

        $inventory->load('productVariant');

        return response()->json([
            'success' => true,
            'message' => 'Inventory created successfully.',
            'data' => new InventoryResource($inventory),
        ], 201);
    }

    /**
     * Display the specified inventory.
     */
    public function show(Inventory $inventory)
    {
        $inventory->load('productVariant');

        return new InventoryResource($inventory);
    }

    /**
     * Update the specified inventory.
     */
    public function update(
        UpdateInventoryRequest $request,
        Inventory $inventory,
        InventoryService $inventoryService
    ) {
        $data = $request->validated();

        // A quantity change goes through the movement log so it stays auditable.
        if (array_key_exists('quantity', $data) && (int) $data['quantity'] !== $inventory->quantity) {
            $inventoryService->createMovement(
                $inventory->product_variant_id,
                StockMovement::TYPE_ADJUSTMENT,
                (int) $data['quantity'],
                'Inventory updated by ' . $request->user()->email
            );
        }

        unset($data['quantity']);

        if ($data) {
            $inventory->refresh()->update($data);
        }

        $inventory->refresh()->load('productVariant');

        return response()->json([
            'success' => true,
            'message' => 'Inventory updated successfully.',
            'data' => new InventoryResource($inventory),
        ]);
    }

    /**
     * Remove the specified inventory.
     */
    public function destroy(Inventory $inventory)
    {
        $inventory->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inventory deleted successfully.',
        ]);
    }

    public function lowStock()
    {
        $inventories = Inventory::with([
            'productVariant.product',
        ])
        ->whereColumn(
            'quantity',
            '<=',
            'low_stock_threshold'
        )
        ->latest()
        ->paginate(10);

        return InventoryResource::collection($inventories);
    }
}