<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::create('products', function (Blueprint $table) {

        // Primary Key
        $table->id();

        // Product Name
        $table->string('name');

        // URL Slug
        $table->string('slug')->unique();

        // Description
        $table->text('description')->nullable();

        // Price
        $table->decimal('price', 10, 2);

        // Quantity in stock
        $table->integer('stock')->default(0);

        // Product status
        $table->boolean('is_active')->default(true);

        // Product image
        $table->string('image')->nullable();

        // SEO title
        $table->string('meta_title')->nullable();

        // SEO description
        $table->text('meta_description')->nullable();

        // created_at & updated_at
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
