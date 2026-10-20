<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Columns are nullable so existing orders remain valid.
     * New orders require them through CreateOrderRequest.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {

            $table->string('shipping_name')->nullable()->after('total');

            $table->string('shipping_phone', 30)->nullable()->after('shipping_name');

            $table->string('shipping_address')->nullable()->after('shipping_phone');

            $table->string('shipping_city')->nullable()->after('shipping_address');

            $table->string('shipping_postal_code', 20)->nullable()->after('shipping_city');

            $table->string('shipping_country')->nullable()->after('shipping_postal_code');

            $table->text('notes')->nullable()->after('shipping_country');

            $table->timestamp('cancelled_at')->nullable()->after('notes');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_name',
                'shipping_phone',
                'shipping_address',
                'shipping_city',
                'shipping_postal_code',
                'shipping_country',
                'notes',
                'cancelled_at',
            ]);
        });
    }
};
