<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
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

            'items_count' => $this->items->count(),

            'total_quantity' => $this->items->sum('quantity'),

            'total' => round($this->items->sum(
                fn ($item) => $item->productVariant->price * $item->quantity
            ), 2),

            'items' => CartItemResource::collection(
                $this->items
            ),

        ];
    }
}