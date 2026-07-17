<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductVariantRequest;
use App\Http\Requests\UpdateProductVariantRequest;
use App\Http\Resources\ProductVariantResource;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

class ProductVariantController extends Controller
{
    /**
     * Display a listing of product variants.
     */
    public function index()
    {
        $variants = ProductVariant::with([
            'product',
            'attributeValues.attribute',
        ])
        ->latest()
        ->paginate(10);

        return ProductVariantResource::collection($variants);
    }

    /**
     * Store a newly created product variant.
     */
    public function store(CreateProductVariantRequest $request)
    {
        $validated = $request->validated();

        $attributeValues = $validated['attribute_values'] ?? [];

        unset($validated['attribute_values']);

        $variant = DB::transaction(function () use ($validated, $attributeValues) {

            $variant = ProductVariant::create($validated);

            if (!empty($attributeValues)) {
                $variant->attributeValues()->sync($attributeValues);
            }

            $variant->load([
                'product',
                'attributeValues.attribute',
            ]);

            return $variant;
        });

        return response()->json([
            'success' => true,
            'message' => 'Product variant created successfully.',
            'data' => new ProductVariantResource($variant),
        ], 201);
    }

    /**
     * Display the specified product variant.
     */
    public function show(ProductVariant $productVariant)
    {
        $productVariant->load([
            'product',
            'attributeValues.attribute',
        ]);

        return new ProductVariantResource($productVariant);
    }

    /**
     * Update the specified product variant.
     */
    public function update(UpdateProductVariantRequest $request,ProductVariant $productVariant) 
    {
        $validated = $request->validated();

        $attributeValues = $validated['attribute_values'] ?? null;

        unset($validated['attribute_values']);

        $productVariant = DB::transaction(function () use (
            $productVariant,
            $validated,
            $attributeValues
        ) {

            $productVariant->update($validated);

            if ($attributeValues !== null) {
                $productVariant->attributeValues()->sync($attributeValues);
            }

            $productVariant->load([
                'product',
                'attributeValues.attribute',
            ]);

            return $productVariant;
        });

        return response()->json([
            'success' => true,
            'message' => 'Product variant updated successfully.',
            'data' => new ProductVariantResource($productVariant),
        ]);
    }

    /**
     * Remove the specified product variant.
     */
    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product variant deleted successfully.',
        ]);
    }
}