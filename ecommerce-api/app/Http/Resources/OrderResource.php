<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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

            'status' => $this->status,

            'subtotal' => $this->subtotal,

            'total' => $this->total,

            'shipping' => [
                'name' => $this->shipping_name,
                'phone' => $this->shipping_phone,
                'address' => $this->shipping_address,
                'city' => $this->shipping_city,
                'postal_code' => $this->shipping_postal_code,
                'country' => $this->shipping_country,
            ],

            'notes' => $this->notes,

            'cancelled_at' => $this->cancelled_at,

            'created_at' => $this->created_at,

            'user' => new UserResource($this->whenLoaded('user')),

            'payment' => $this->whenLoaded('payment', function () {
                return $this->payment
                    ? new PaymentResource($this->payment)
                    : null;
            }),

            'items_count' => $this->items->count(),

            'items' => OrderItemResource::collection(
                $this->whenLoaded('items')
            ),

        ];
    }
}