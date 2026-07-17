<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductVariantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'product_id' => [
                'sometimes',
                'exists:products,id',
            ],

            'sku' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('product_variants', 'sku')
                    ->ignore($this->product_variant),
            ],

            'price' => [
                'sometimes',
                'numeric',
                'min:0',
            ],

            'stock' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:255',
            ],

            'weight' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
            
            'attribute_values' => [
                'sometimes',
                'array',
            ],

            'attribute_values.*' => [
                'exists:attribute_values,id',
            ],
        ];
    }
}