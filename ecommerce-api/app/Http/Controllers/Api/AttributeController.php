<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateAttributeRequest;
use App\Http\Requests\UpdateAttributeRequest;
use App\Http\Resources\AttributeResource;
use App\Models\Attribute;

class AttributeController extends Controller
{
    /**
     * Display a listing of attributes.
     */
    public function index()
    {
        $attributes = Attribute::withCount('values')
            ->latest()
            ->paginate(10);

        return AttributeResource::collection($attributes);
    }

    /**
     * Store a newly created attribute.
     */
    public function store(CreateAttributeRequest $request)
    {
        $attribute = Attribute::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attribute created successfully.',
            'data' => new AttributeResource($attribute),
        ], 201);
    }

    /**
     * Display the specified attribute.
     */
    public function show(Attribute $attribute)
    {
        $attribute->loadCount('values');

        return new AttributeResource($attribute);
    }

    /**
     * Update the specified attribute.
     */
    public function update(UpdateAttributeRequest $request, Attribute $attribute)
    {
        $attribute->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attribute updated successfully.',
            'data' => new AttributeResource($attribute),
        ]);
    }

    /**
     * Remove the specified attribute.
     */
    public function destroy(Attribute $attribute)
    {
        $attribute->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attribute deleted successfully.',
        ]);
    }
}