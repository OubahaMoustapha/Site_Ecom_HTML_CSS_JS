<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'name' => $this->name,

            'slug' => $this->slug,

            'description' => $this->description,

            'price' => (float) $this->price,

            'stock' => $this->stock,

            'is_active' => (bool) $this->is_active,

            'image' => $this->image,

            'category_id' => $this->category_id,
            'category' => $this->category?->name,

            'brand_id' => $this->brand_id,
            'brand' => $this->brand?->name,

            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}