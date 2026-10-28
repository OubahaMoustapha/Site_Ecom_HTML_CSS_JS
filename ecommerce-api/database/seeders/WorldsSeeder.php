<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Creates the four storefront "worlds" as parent categories and fills
 * fashion, food and books with demo products. Existing demo tech
 * categories (slug "demo-*") are attached to the electronics world.
 *
 * Usage: php artisan db:seed --class=WorldsSeeder
 */
class WorldsSeeder extends Seeder
{
    public function run(InventoryService $inventory): void
    {
        if (Category::where('slug', 'world-electronics')->exists()) {
            $this->command?->warn('Worlds already exist. Skipping.');

            return;
        }

        DB::transaction(function () use ($inventory) {

            $worlds = [];

            foreach ([
                'electronics' => 'إلكترونيات',
                'fashion' => 'أزياء وأناقة',
                'food' => 'أطعمة',
                'books' => 'كتب ومدرسة',
            ] as $key => $name) {
                $worlds[$key] = Category::create([
                    'name' => $name,
                    'slug' => "world-{$key}",
                    'description' => "Storefront world: {$key}",
                ]);
            }

            // Attach the existing demo tech categories to the electronics world.
            Category::where('slug', 'like', 'demo-%')
                ->update(['parent_id' => $worlds['electronics']->id]);

            $size = $this->attribute('world-size', 'Size', ['S', 'M', 'L']);
            $weight = $this->attribute('world-weight', 'Weight', ['250g', '500g', '1kg', '3kg']);
            $volume = $this->attribute('world-volume', 'Volume', ['50ml', '1L', '5L']);
            $edition = $this->attribute('world-edition', 'Edition', ['غلاف ورقي', 'غلاف مقوى']);
            $pack = $this->attribute('world-pack', 'Pack', ['وحدة', 'طقم 10']);

            $catalog = [
                'fashion' => [
                    'معاطف' => [
                        ['معطف صوف طويل', 'Maison Atlas', 1890, $size, ['S', 'M', 'L']],
                    ],
                    'فساتين' => [
                        ['فستان سهرة قرمزي', 'Maison Atlas', 1450, $size, ['S', 'M', 'L']],
                        ['فستان صيفي', 'Riad Couture', 450, $size, ['S', 'M']],
                    ],
                    'حقائب' => [
                        ['حقيبة يد جلدية', 'Riad Couture', 980, $pack, ['وحدة']],
                        ['حقيبة ظهر جلدية', 'Maison Atlas', 590, $pack, ['وحدة']],
                    ],
                    'أحذية' => [
                        ['حذاء جلدي كلاسيكي', 'Maison Atlas', 1120, $size, ['M', 'L']],
                    ],
                    'مجوهرات وعطور' => [
                        ['قرط مطلي بالذهب', 'Riad Couture', 260, $pack, ['وحدة']],
                        ['عطر زهري', 'Riad Couture', 420, $volume, ['50ml']],
                    ],
                ],
                'food' => [
                    'خضر وفواكه' => [
                        ['طماطم بلدية', 'تعاونية سوس', 9, $weight, ['1kg', '3kg']],
                        ['تفاح أحمر', 'تعاونية ميدلت', 16, $weight, ['1kg', '3kg']],
                    ],
                    'مخبوزات' => [
                        ['خبز قمح كامل', 'مخبزة الحي', 7, $pack, ['وحدة']],
                    ],
                    'زيوت وتوابل' => [
                        ['زيت زيتون بكر ممتاز', 'تعاونية تاونات', 95, $volume, ['1L', '5L']],
                        ['زيت أركان أصلي', 'تعاونية سوس', 149, $volume, ['50ml', '1L']],
                    ],
                    'منتجات محلية' => [
                        ['عسل زهور جبلي', 'مناحل الأطلس', 110, $weight, ['250g', '500g']],
                        ['تمر مجهول', 'واحات تافيلالت', 87, $weight, ['500g', '1kg']],
                        ['قهوة مختصة', 'محمصة الدار', 95, $weight, ['250g', '500g']],
                    ],
                ],
                'books' => [
                    'كلاسيكيات' => [
                        ['مقدمة ابن خلدون', 'ابن خلدون', 120, $edition, ['غلاف ورقي', 'غلاف مقوى']],
                        ['كليلة ودمنة', 'ابن المقفع', 65, $edition, ['غلاف ورقي']],
                        ['طوق الحمامة', 'ابن حزم', 58, $edition, ['غلاف ورقي']],
                        ['حي بن يقظان', 'ابن طفيل', 45, $edition, ['غلاف ورقي']],
                        ['رحلة ابن بطوطة', 'ابن بطوطة', 140, $edition, ['غلاف ورقي', 'غلاف مقوى']],
                        ['البخلاء', 'الجاحظ', 55, $edition, ['غلاف ورقي']],
                    ],
                    'قرطاسية' => [
                        ['دفاتر مدرسية', 'قرطاسية النور', 45, $pack, ['طقم 10']],
                        ['أقلام وتلوين', 'قرطاسية النور', 39, $pack, ['وحدة']],
                        ['حقيبة مدرسية', 'قرطاسية النور', 219, $pack, ['وحدة']],
                        ['آلة حاسبة علمية', 'قرطاسية النور', 149, $pack, ['وحدة']],
                    ],
                ],
            ];

            $n = 0;

            foreach ($catalog as $worldKey => $categories) {
                foreach ($categories as $categoryName => $products) {

                    $category = Category::create([
                        'name' => $categoryName,
                        'slug' => "{$worldKey}-" . (++$n),
                        'parent_id' => $worlds[$worldKey]->id,
                    ]);

                    foreach ($products as [$name, $brandName, $price, $attribute, $values]) {

                        $brand = Brand::firstOrCreate(
                            ['name' => $brandName],
                            ['slug' => 'world-brand-' . (++$n)]
                        );

                        $product = Product::create([
                            'name' => $name,
                            'slug' => 'world-product-' . (++$n),
                            'description' => "{$name} — {$brandName}",
                            'price' => $price,
                            'stock' => 0,
                            'category_id' => $category->id,
                            'brand_id' => $brand->id,
                        ]);

                        foreach ($values as $index => $value) {

                            // Larger packs cost proportionally more.
                            $variantPrice = $price * (1 + $index * 1.6);

                            $variant = $product->variants()->create([
                                'sku' => sprintf('W-%04d-%d', $product->id, $index + 1),
                                'price' => round($variantPrice, 2),
                            ]);

                            $variant->attributeValues()->attach(
                                $attribute->values()->where('value', $value)->value('id')
                            );

                            $variant->inventory()->create([
                                'quantity' => 0,
                                'low_stock_threshold' => 10,
                            ]);

                            $inventory->createMovement(
                                $variant->id,
                                StockMovement::TYPE_IN,
                                150 + ($n % 7) * 40,
                                'Initial world stock'
                            );
                        }
                    }
                }
            }
        });

        $this->command?->info('Worlds created and filled with demo products.');
    }

    private function attribute(string $slug, string $name, array $values): Attribute
    {
        $attribute = Attribute::create(['name' => $name, 'slug' => $slug]);

        foreach ($values as $value) {
            $attribute->values()->create(['value' => $value]);
        }

        return $attribute;
    }
}
