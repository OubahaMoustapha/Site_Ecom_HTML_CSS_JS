<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AdminOrderController;
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
| Catalog (public, read-only)
|--------------------------------------------------------------------------
*/

// ProductController routes
Route::apiResource('products', ProductController::class)->only(['index', 'show']);

// CategoryController routes
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);

// BrandController routes
Route::apiResource('brands', BrandController::class)->only(['index', 'show']);

// ProductImageController routes
Route::get('products/{product}/images', [ProductImageController::class, 'index']);

// AttributeController routes
Route::apiResource('attributes', AttributeController::class)->only(['index', 'show']);

// AttributeValueController routes
Route::apiResource('attribute-values', AttributeValueController::class)->only(['index', 'show']);

// ProductVariantController routes
Route::apiResource('product-variants', ProductVariantController::class)->only(['index', 'show']);

/*
|--------------------------------------------------------------------------
| Administration (authenticated administrators only)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Catalog management
    |--------------------------------------------------------------------------
    */

    Route::apiResource('products', ProductController::class)->except(['index', 'show']);

    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);

    Route::apiResource('brands', BrandController::class)->except(['index', 'show']);

    Route::post('products/{product}/images', [ProductImageController::class, 'store']);
    Route::delete('products/{product}/images/{productImage}', [ProductImageController::class, 'destroy']);

    Route::apiResource('attributes', AttributeController::class)->except(['index', 'show']);

    Route::apiResource('attribute-values', AttributeValueController::class)->except(['index', 'show']);

    Route::apiResource('product-variants', ProductVariantController::class)->except(['index', 'show']);

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
    | Orders management
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')->group(function () {

        Route::get('/orders', [AdminOrderController::class, 'index']);

        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);

        Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    });

});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    // Limited per email + IP (see the "auth" limiter in AppServiceProvider).
    Route::middleware('throttle:auth')->group(function () {

        Route::post('/register', [AuthController::class, 'register']);

        Route::post('/login', [AuthController::class, 'login']);

        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

        Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    });

    Route::get(
        '/email/verify/{id}/{hash}',
        [AuthController::class, 'verifyEmail']
    )->middleware('signed')->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/me', [AuthController::class, 'me']);

        Route::put('/profile', [AuthController::class, 'updateProfile']);

        Route::put('/change-password', [AuthController::class, 'changePassword']);

        Route::post('/email/resend', [AuthController::class, 'resendVerification'])
            ->middleware('throttle:6,1');

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

    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

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