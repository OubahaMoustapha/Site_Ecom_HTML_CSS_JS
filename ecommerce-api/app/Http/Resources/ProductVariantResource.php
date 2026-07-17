<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'product_id' => $this->product_id,

            'product' => $this->whenLoaded('product', function () {
                return $this->product->name;
            }),

            'sku' => $this->sku,

            'price' => (float) $this->price,

            'stock' => $this->stock,

            'barcode' => $this->barcode,

            'weight' => $this->weight !== null
                ? (float) $this->weight
                : null,

            'is_active' => (bool) $this->is_active,

            'attribute_values' => AttributeValueResource::collection(
                $this->whenLoaded('attributeValues')
            ),

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}