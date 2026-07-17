<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductImageController;
use App\Http\Controllers\Api\AttributeController;
use App\Http\Controllers\Api\AttributeValueController;
use App\Http\Controllers\Api\ProductVariantController;

// ProductController routes
Route::apiResource('products', ProductController::class);

// CategoryController routes
Route::apiResource('categories', CategoryController::class);

// BrandController routes
Route::apiResource('brands', BrandController::class);

// ProductImageController routes
Route::post( 'products/{product}/images', [ProductImageController::class, 'store'] );
Route::get( 'products/{product}/images', [ProductImageController::class, 'index'] );
Route::delete( 'products/{product}/images/{productImage}', [ProductImageController::class, 'destroy'] );

// AttributeController routes
Route::apiResource('attributes', AttributeController::class);

// AttributeValueController routes
Route::apiResource('attribute-values', AttributeValueController::class);
// ProductVariantController routes
Route::apiResource('product-variants', ProductVariantController::class);
