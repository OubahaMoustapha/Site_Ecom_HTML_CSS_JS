<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    /**
     * Seed a small demo catalog: one product with two sized variants and stock.
     */
    public function run(): void
    {
        $category = Category::create([
            'name' => 'T-Shirts',
            'slug' => 't-shirts',
        ]);

        $brand = Brand::create([
            'name' => 'Demo Brand',
            'slug' => 'demo-brand',
        ]);

        $size = Attribute::create([
            'name' => 'Size',
            'slug' => 'size',
        ]);

        $small = $size->values()->create(['value' => 'S']);

        $medium = $size->values()->create(['value' => 'M']);

        $product = Product::create([
            'name' => 'Classic T-Shirt',
            'slug' => 'classic-t-shirt',
            'description' => 'Cotton t-shirt used for API demos.',
            'price' => 19.99,
            'stock' => 0,
            'category_id' => $category->id,
            'brand_id' => $brand->id,
        ]);

        foreach ([['TSHIRT-S', $small, 20], ['TSHIRT-M', $medium, 3]] as [$sku, $value, $quantity]) {

            $variant = $product->variants()->create([
                'sku' => $sku,
                'price' => 19.99,
            ]);

            $variant->attributeValues()->attach($value->id);

            $variant->inventory()->create([
                'quantity' => $quantity,
                'low_stock_threshold' => 5,
            ]);
        }
    }
}
