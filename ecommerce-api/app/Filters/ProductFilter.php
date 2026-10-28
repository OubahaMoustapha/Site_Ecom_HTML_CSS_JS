<?php

namespace App\Filters;

use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;

class ProductFilter
{
    /**
     * Catalog routes are public, so the token is read optionally.
     */
    public static function viewerIsAdmin(): bool
    {
        return (bool) auth('sanctum')->user()?->isAdmin();
    }

    public static function apply(Builder $query): Builder
    {
        // Search
        if ($search = request('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Active filter
        // Visitors and customers only ever see active products; administrators
        // may filter by status. boolean() maps "true"/"false"/"1"/"0" correctly.
        if (! self::viewerIsAdmin()) {
            $query->where('is_active', true);
        } elseif (request()->has('is_active')) {
            $query->where('is_active', request()->boolean('is_active'));
        }

        // Category filter (a parent category also matches its direct sub-categories)
        if (request()->filled('category_id')) {
            $categoryId = (int) request('category_id');

            $query->where(function (Builder $query) use ($categoryId) {
                $query->where('category_id', $categoryId)
                    ->orWhereIn('category_id', Category::where('parent_id', $categoryId)->select('id'));
            });
        }

        // Brand filter
        if (request()->filled('brand_id')) {
            $query->where('brand_id', request('brand_id'));
        }

        // Minimum price
        if (request()->filled('min_price')) {
            $query->where('price', '>=', request('min_price'));
        }

        // Maximum price
        if (request()->filled('max_price')) {
            $query->where('price', '<=', request('max_price'));
        }

        // Sorting
        if ($sort = request('sort')) {

            $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';

            $column = ltrim($sort, '-');

            $allowedSorts = [
                'price',
                'name',
                'created_at'
            ];

            if (in_array($column, $allowedSorts)) {
                $query->orderBy($column, $direction);
            }
        }

        return $query;
    }
}