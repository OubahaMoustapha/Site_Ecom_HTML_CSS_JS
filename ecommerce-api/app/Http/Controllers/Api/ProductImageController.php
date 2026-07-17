<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductImageRequest;
use App\Http\Resources\ProductImageResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{


    public function index(Product $product)
    {
        return ProductImageResource::collection(
            $product->images()->latest()->get()
        );
    }

    /**
     * Store a newly created product image.
     */
    public function store(CreateProductImageRequest $request, Product $product)
    {
        // Ensure only one primary image exists for the product
        if ($request->boolean('is_primary')) {

            $product->images()->update([
                'is_primary' => false
            ]);
        }

        $path = $request->file('image')->store('products', 'public');

        $image = ProductImage::create([
            'product_id' => $product->id,
            'image' => $path,
            'is_primary' => $request->boolean('is_primary'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully.',
            'data' => new ProductImageResource($image)
        ], 201);
    }

    public function destroy(Product $product, ProductImage $productImage)
    {
        // Ensure the image belongs to the specified product
        if ($productImage->product_id !== $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Image does not belong to this product.'
            ], 404);
        }

        // Delete the image file from storage
        Storage::disk('public')->delete($productImage->image);

        // Delete the database record
        $productImage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully.'
        ]);
    }
}