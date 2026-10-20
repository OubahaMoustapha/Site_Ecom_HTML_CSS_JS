<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    /**
     * Create a stock movement and update inventory.
     *
     * The inventory row is locked for the duration of the transaction
     * so concurrent movements cannot read a stale quantity.
     *
     * @throws ValidationException
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

            $inventory = Inventory::where('product_variant_id', $productVariantId)
                ->lockForUpdate()
                ->first();

            if (!$inventory) {
                throw ValidationException::withMessages([
                    'product_variant_id' => [
                        'Inventory record not found for this product variant.',
                    ],
                ]);
            }

            $quantityBefore = $inventory->quantity;

            switch ($type) {

                case StockMovement::TYPE_IN:
                    $inventory->quantity += $quantity;
                    break;

                case StockMovement::TYPE_OUT:

                    if ($inventory->quantity < $quantity) {
                        throw ValidationException::withMessages([
                            'quantity' => [
                                "Insufficient stock. Only {$inventory->quantity} item(s) available.",
                            ],
                        ]);
                    }

                    $inventory->quantity -= $quantity;
                    break;

                case StockMovement::TYPE_ADJUSTMENT:
                    $inventory->quantity = $quantity;
                    break;

                default:
                    throw ValidationException::withMessages([
                        'type' => ['Invalid stock movement type.'],
                    ]);
            }

            $inventory->save();

            $movement = StockMovement::create([
                'product_variant_id' => $productVariantId,
                'type'               => $type,
                'quantity_before'    => $quantityBefore,
                'quantity'           => $quantity,
                'note'               => $note,
            ]);

            return $movement->load('productVariant');
        });
    }
}