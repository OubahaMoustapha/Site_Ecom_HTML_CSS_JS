<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateAttributeValueRequest;
use App\Http\Requests\UpdateAttributeValueRequest;
use App\Http\Resources\AttributeValueResource;
use App\Models\AttributeValue;

class AttributeValueController extends Controller
{
    /**
     * Display a listing of attribute values.
     */
    public function index()
    {
        $values = AttributeValue::with('attribute')
            ->latest()
            ->paginate(10);

        return AttributeValueResource::collection($values);
    }

    /**
     * Store a newly created attribute value.
     */
    public function store(CreateAttributeValueRequest $request)
    {
        $value = AttributeValue::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attribute value created successfully.',
            'data' => new AttributeValueResource($value),
        ], 201);
    }

    /**
     * Display the specified attribute value.
     */
    public function show(AttributeValue $attributeValue)
    {
        $attributeValue->load('attribute');

        return new AttributeValueResource($attributeValue);
    }

    /**
     * Update the specified attribute value.
     */
    public function update(UpdateAttributeValueRequest $request, AttributeValue $attributeValue)
    {
        $attributeValue->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Attribute value updated successfully.',
            'data' => new AttributeValueResource($attributeValue),
        ]);
    }

    /**
     * Remove the specified attribute value.
     */
    public function destroy(AttributeValue $attributeValue)
    {
        $attributeValue->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attribute value deleted successfully.',
        ]);
    }
}