<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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

            'product_variant_id' => $this->product_variant_id,

            'product_name' => $this->product_name,

            'sku' => $this->sku,

            'price' => $this->price,

            'quantity' => $this->quantity,

            'subtotal' => $this->subtotal,

        ];
    }
}