<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductImageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'product_id' => $this->product_id,

            'image' => $this->image,

            'url' => Storage::url($this->image),

            'is_primary' => (bool) $this->is_primary,

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}