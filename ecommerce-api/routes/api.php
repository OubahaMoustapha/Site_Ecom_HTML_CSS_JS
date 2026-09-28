<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductImageController;
use App\Http\Controllers\Api\AttributeController;
use App\Http\Controllers\Api\AttributeValueController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;

/*
|--------------------------------------------------------------------------
| Catalog
|--------------------------------------------------------------------------
*/

// ProductController routes
Route::apiResource('products', ProductController::class);

// CategoryController routes
Route::apiResource('categories', CategoryController::class);

// BrandController routes
Route::apiResource('brands', BrandController::class);

// ProductImageController routes
Route::post('products/{product}/images', [ProductImageController::class, 'store']);
Route::get('products/{product}/images', [ProductImageController::class, 'index']);
Route::delete('products/{product}/images/{productImage}', [ProductImageController::class, 'destroy']);

// AttributeController routes
Route::apiResource('attributes', AttributeController::class);

// AttributeValueController routes
Route::apiResource('attribute-values', AttributeValueController::class);

// ProductVariantController routes
Route::apiResource('product-variants', ProductVariantController::class);

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

// Low Stock
Route::get('inventories/low-stock', [InventoryController::class, 'lowStock']);

// InventoryController routes
Route::apiResource('inventories', InventoryController::class);

// StockMovementController routes
Route::apiResource('stock-movements', StockMovementController::class)
    ->only([
        'index',
        'store',
        'show',
    ]);

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    Route::post('/register', [AuthController::class, 'register']);

    Route::post('/login', [AuthController::class, 'login']);

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::get(
        '/email/verify/{id}/{hash}',
        [AuthController::class, 'verifyEmail']
    )->middleware('signed')->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/me', [AuthController::class, 'me']);

        Route::put('/profile', [AuthController::class, 'updateProfile']);

        Route::put('/change-password', [AuthController::class, 'changePassword']);

        Route::post('/email/resend', [AuthController::class, 'resendVerification']);

    });

});

/*
|--------------------------------------------------------------------------
| Cart & Orders
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Cart
    |--------------------------------------------------------------------------
    */

    Route::get('/cart', [CartController::class, 'index']);

    Route::post('/cart', [CartController::class, 'store']);

    Route::patch(
        '/cart/items/{cartItem}',
        [CartController::class, 'update']
    );

    Route::delete(
        '/cart/items/{cartItem}',
        [CartController::class, 'destroy']
    );

    Route::delete('/cart', [CartController::class, 'clear']);

    /*
    |--------------------------------------------------------------------------
    | Orders
    |--------------------------------------------------------------------------
    */

    Route::get('/orders', [OrderController::class, 'index']);

    Route::post('/orders', [OrderController::class, 'store']);

    Route::get('/orders/{order}', [OrderController::class, 'show']);
    
    Route::get( '/orders/{order}/invoice',[OrderController::class, 'downloadInvoice']);
    
    /*
    |--------------------------------------------------------------------------
    | Payment
    |--------------------------------------------------------------------------
    */


    Route::get('/payments', [PaymentController::class, 'index']);

    Route::post('/payments', [PaymentController::class, 'store']);

    Route::get('/payments/{payment}', [PaymentController::class, 'show']);

});