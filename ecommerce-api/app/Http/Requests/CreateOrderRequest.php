<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'shipping_name' => [
                'required',
                'string',
                'max:255',
            ],

            'shipping_phone' => [
                'required',
                'string',
                'max:30',
            ],

            'shipping_address' => [
                'required',
                'string',
                'max:255',
            ],

            'shipping_city' => [
                'required',
                'string',
                'max:255',
            ],

            'shipping_postal_code' => [
                'nullable',
                'string',
                'max:20',
            ],

            'shipping_country' => [
                'required',
                'string',
                'max:255',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],

        ];
    }
}
