<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'product_variant_id' => $this->product_variant_id,

            'variant' => $this->whenLoaded('productVariant', function () {
                return [
                    'id' => $this->productVariant->id,
                    'sku' => $this->productVariant->sku,
                ];
            }),

            'quantity' => $this->quantity,

            'low_stock_threshold' => $this->low_stock_threshold,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}