<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
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

            'type' => $this->type,

            'quantity_before' => $this->quantity_before,

            'quantity' => $this->quantity,

            'note' => $this->note,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}