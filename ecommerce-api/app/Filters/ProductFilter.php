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
        if (request()->has('is_active')) {
            $query->where('is_active', request('is_active'));
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