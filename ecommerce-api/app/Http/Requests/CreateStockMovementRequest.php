<?php

namespace App\Http\Requests;

use App\Models\StockMovement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStockMovementRequest extends FormRequest
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

            'product_variant_id' => [
                'required',
                'integer',
                Rule::exists('product_variants', 'id'),
            ],

            'type' => [
                'required',
                Rule::in([
                    StockMovement::TYPE_IN,
                    StockMovement::TYPE_OUT,
                    StockMovement::TYPE_ADJUSTMENT,
                ]),
            ],

            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],

            'note' => [
                'nullable',
                'string',
                'max:1000',
            ],

        ];
    }
}