<?php

namespace App\Services;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceService
{
    /**
     * Generate PDF invoice for an order.
     */
    public function generate(Order $order)
    {
        $order->load([
            'user',
            'items',
            'payment',
        ]);

        $pdf = Pdf::loadView(
            'invoices.order',
            [
                'order' => $order,
            ]
        );

        return $pdf;
    }
}