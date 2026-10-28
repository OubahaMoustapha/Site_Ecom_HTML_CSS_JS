<?php

namespace App\Http\Controllers\Api;

use App\Filters\ProductFilter;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\OrderItem;
use App\Models\Product;


class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Variants (with stock) and images are included so a listing can add
        // to the cart without one extra request per product.
        $query = Product::with([
            'category',
            'brand',
            'images',
            'variants.inventory',
            'variants.attributeValues.attribute',
        ]);

        $query = ProductFilter::apply($query);

        $perPage = min(max((int) request('per_page', 10), 1), 50);

        $products = $query->paginate($perPage)->withQueryString();

        return ProductResource::collection($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateProductRequest $request)
    {
        $product = Product::create($request->validated());

        $product->load(['category', 'brand']);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => new ProductResource($product)
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        // An inactive product does not exist for anyone but administrators.
        abort_if(! $product->is_active && ! ProductFilter::viewerIsAdmin(), 404);

        $product->load([
            'category',
            'brand',
            'images',
            'variants.inventory',
            'variants.attributeValues.attribute',
        ]);

        return new ProductResource($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        $product->update($request->validated());

        $product->load(['category', 'brand']);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => new ProductResource($product)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        // Deleting would cascade to variants and erase order history.
        if (OrderItem::whereIn('product_variant_id', $product->variants()->select('id'))->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Product has been ordered and cannot be deleted. Deactivate it instead.',
            ], 409);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.'
        ]);
    }
}