<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,

            'quantity' => $this->quantity,

            'variant_id' => $this->productVariant->id,

            'sku' => $this->productVariant->sku,

            'price' => $this->productVariant->price,

            'product_name' => $this->productVariant->product->name,

            'subtotal' => round($this->productVariant->price * $this->quantity, 2),

        ];
    }
}