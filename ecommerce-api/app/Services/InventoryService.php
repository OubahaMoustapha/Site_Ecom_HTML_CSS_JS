<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class InventoryService
{
    /**
     * Create a stock movement and update inventory.
     *
     * @throws RuntimeException
     */
    public function createMovement(
        int $productVariantId,
        string $type,
        int $quantity,
        ?string $note = null
    ): StockMovement
    {
        return DB::transaction(function () use (
            $productVariantId,
            $type,
            $quantity,
            $note
        ) {

            $variant = ProductVariant::with('inventory')
                ->findOrFail($productVariantId);

            $inventory = $variant->inventory;

            if (!$inventory) {
                throw new RuntimeException(
                    'Inventory record not found for this product variant.'
                );
            }

            $quantityBefore = $inventory->quantity;

            switch ($type) {

                case StockMovement::TYPE_IN:
                    $inventory->quantity += $quantity;
                    break;

                case StockMovement::TYPE_OUT:

                    if ($inventory->quantity < $quantity) {
                        throw new RuntimeException('Insufficient stock.');
                    }

                    $inventory->quantity -= $quantity;
                    break;

                case StockMovement::TYPE_ADJUSTMENT:
                    $inventory->quantity = $quantity;
                    break;

                default:
                    throw new RuntimeException('Invalid stock movement type.');
            }

            $inventory->save();

            $movement = StockMovement::create([
                'product_variant_id' => $variant->id,
                'type'               => $type,
                'quantity_before'    => $quantityBefore,
                'quantity'           => $quantity,
                'note'               => $note,
            ]);

            return $movement->load('productVariant');
        });
    }
}