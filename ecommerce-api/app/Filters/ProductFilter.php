<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;

class ProductFilter
{
    public static function apply(Builder $query): Builder
    {
        // Search
        if ($search = request('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Active filter
        // boolean() maps "true"/"false"/"1"/"0" query strings correctly
        if (request()->has('is_active')) {
            $query->where('is_active', request()->boolean('is_active'));
        }

        // Category filter
        if (request()->filled('category_id')) {
            $query->where('category_id', request('category_id'));
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