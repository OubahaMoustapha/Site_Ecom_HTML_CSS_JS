<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Adds 15 demo rows to every business table without touching existing data.
 *
 * Usage: php artisan db:seed --class=DemoDataSeeder
 *
 * All demo records use the "demo-" slug / "DEMO-" SKU prefix and
 * "@demo.test" emails. No events are fired, so no email is sent.
 */
class DemoDataSeeder extends Seeder
{
    private const COUNT = 15;

    public function run(InventoryService $inventory): void
    {
        if (Product::where('slug', 'like', 'demo-%')->exists()) {
            $this->command?->warn('Demo data already exists. Skipping.');

            return;
        }

        DB::transaction(function () use ($inventory) {

            $password = Hash::make('password');

            /*
            |--------------------------------------------------------------------------
            | Users (1 admin + 14 customers)
            |--------------------------------------------------------------------------
            */

            $users = collect(range(1, self::COUNT))->map(function (int $i) use ($password) {
                $user = new User([
                    'name' => $i === 1 ? 'Demo Admin' : "Demo Customer {$i}",
                    'email' => $i === 1 ? 'admin@demo.test' : "customer{$i}@demo.test",
                    'password' => 'placeholder',
                ]);

                // Bypass the "hashed" cast double-hashing and mass-assignment guard on role.
                $user->forceFill([
                    'password' => $password,
                    'role' => $i === 1 ? User::ROLE_ADMIN : User::ROLE_CUSTOMER,
                    'email_verified_at' => now(),
                ])->saveQuietly();

                return $user;
            });

            $customers = $users->slice(1)->values();

            /*
            |--------------------------------------------------------------------------
            | Catalog
            |--------------------------------------------------------------------------
            */

            $categoryNames = ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Smartwatches', 'Cameras', 'Gaming', 'Monitors', 'Keyboards', 'Mice', 'Speakers', 'Chargers', 'Cables', 'Storage', 'Networking'];
            $brandNames = ['Apex', 'Nordic', 'Zenith', 'Orbit', 'Pulse', 'Vertex', 'Lumen', 'Quanta', 'Helix', 'Nimbus', 'Atlas', 'Echo', 'Fusion', 'Prism', 'Vortex'];
            $attributeNames = ['Color', 'Size', 'Storage Capacity', 'RAM', 'Screen Size', 'Material', 'Connectivity', 'Battery', 'Resolution', 'Weight Class', 'Warranty', 'Edition', 'Switch Type', 'Power', 'Finish'];
            $attributeValues = ['Black', 'Large', '512 GB', '16 GB', '15 inch', 'Aluminium', 'Bluetooth 5.3', '5000 mAh', '4K', 'Light', '2 Years', 'Pro', 'Mechanical', '65 W', 'Matte'];

            Storage::disk('public')->makeDirectory('products');

            $variants = [];

            for ($i = 0; $i < self::COUNT; $i++) {

                $n = $i + 1;

                $category = Category::create([
                    'name' => $categoryNames[$i],
                    'slug' => 'demo-' . str($categoryNames[$i])->slug(),
                    'description' => "Demo category: {$categoryNames[$i]}",
                ]);

                $brand = Brand::create([
                    'name' => $brandNames[$i],
                    'slug' => 'demo-' . str($brandNames[$i])->slug(),
                    'website' => 'https://example.com/' . str($brandNames[$i])->slug(),
                ]);

                $attribute = Attribute::create([
                    'name' => $attributeNames[$i],
                    'slug' => 'demo-' . str($attributeNames[$i])->slug(),
                ]);

                $value = $attribute->values()->create([
                    'value' => $attributeValues[$i],
                ]);

                $price = 50 + ($n * 37.5);

                $product = Product::create([
                    'name' => "{$brandNames[$i]} {$categoryNames[$i]} {$n}",
                    'slug' => "demo-product-{$n}",
                    'description' => "Demo product number {$n}.",
                    'price' => $price,
                    'stock' => 0,
                    'category_id' => $category->id,
                    'brand_id' => $brand->id,
                ]);

                $path = "products/demo-product-{$n}.png";
                Storage::disk('public')->put($path, $this->placeholderImage($n));

                $product->images()->create([
                    'image' => $path,
                    'is_primary' => true,
                ]);

                $variant = $product->variants()->create([
                    'sku' => sprintf('DEMO-%03d', $n),
                    'price' => $price,
                    'weight' => 0.5 + $n / 10,
                ]);

                $variant->attributeValues()->attach($value->id);

                $variant->inventory()->create([
                    'quantity' => 0,
                    'low_stock_threshold' => 10,
                ]);

                // Plentiful stock, recorded as an "in" movement for traceability.
                $inventory->createMovement(
                    $variant->id,
                    StockMovement::TYPE_IN,
                    200 + ($n * 20),
                    'Initial demo stock'
                );

                $variants[] = $variant;
            }

            /*
            |--------------------------------------------------------------------------
            | Carts (one per user, one item each)
            |--------------------------------------------------------------------------
            */

            foreach ($users as $index => $user) {
                $cart = Cart::create(['user_id' => $user->id]);

                $cart->items()->create([
                    'product_variant_id' => $variants[$index]->id,
                    'quantity' => 1,
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Orders, order items and payments
            |--------------------------------------------------------------------------
            */

            $statuses = array_merge(
                array_fill(0, 5, Order::STATUS_PAID),
                array_fill(0, 4, Order::STATUS_PROCESSING),
                array_fill(0, 3, Order::STATUS_SHIPPED),
                array_fill(0, 3, Order::STATUS_COMPLETED),
            );

            $methods = ['cash', 'card', 'paypal'];

            for ($i = 0; $i < self::COUNT; $i++) {

                $customer = $customers[$i % $customers->count()];
                $variant = $variants[($i + 3) % self::COUNT];
                $quantity = ($i % 3) + 1;
                $subtotal = $variant->price * $quantity;

                $order = Order::create([
                    'user_id' => $customer->id,
                    'status' => $statuses[$i],
                    'subtotal' => $subtotal,
                    'total' => $subtotal,
                    'shipping_name' => $customer->name,
                    'shipping_phone' => sprintf('06%08d', $i + 1),
                    'shipping_address' => ($i + 1) . ' Demo Street',
                    'shipping_city' => ['Casablanca', 'Rabat', 'Marrakesh', 'Tangier', 'Fes'][$i % 5],
                    'shipping_postal_code' => (string) (20000 + $i),
                    'shipping_country' => 'Morocco',
                ]);

                $order->items()->create([
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name,
                    'sku' => $variant->sku,
                    'price' => $variant->price,
                    'quantity' => $quantity,
                    'subtotal' => $subtotal,
                ]);

                $inventory->createMovement(
                    $variant->id,
                    StockMovement::TYPE_OUT,
                    $quantity,
                    "Customer order #{$order->id}"
                );

                Payment::create([
                    'order_id' => $order->id,
                    'amount' => $subtotal,
                    'method' => $methods[$i % 3],
                    'status' => 'paid',
                    'transaction_id' => sprintf('DEMO-TX-%04d', $i + 1),
                    'paid_at' => now()->subDays(self::COUNT - $i),
                ]);
            }
        });

        $this->command?->info('Demo data created: 15 rows per table. Admin login: admin@demo.test / password');
    }

    /**
     * Generate a simple PNG placeholder with GD.
     */
    private function placeholderImage(int $n): string
    {
        $image = imagecreatetruecolor(400, 400);

        $background = imagecolorallocate($image, (40 * $n) % 256, (90 + 25 * $n) % 256, (160 + 13 * $n) % 256);
        $white = imagecolorallocate($image, 255, 255, 255);

        imagefill($image, 0, 0, $background);
        imagestring($image, 5, 150, 190, "DEMO {$n}", $white);

        ob_start();
        imagepng($image);
        $png = ob_get_clean();

        imagedestroy($image);

        return $png;
    }
}
