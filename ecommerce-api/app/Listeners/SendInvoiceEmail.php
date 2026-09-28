<?php

namespace App\Listeners;

use App\Events\PaymentCompleted;
use App\Mail\InvoiceMail;
use Illuminate\Support\Facades\Mail;

class SendInvoiceEmail
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
    }

    /**
     * Handle the event.
     */
    public function handle(PaymentCompleted $event): void
    {
        $payment = $event->payment->load([
            'order.user',
            'order.items',
        ]);

        Mail::to(
            $payment->order->user->email
        )->send(
            new InvoiceMail($payment)
        );
    }
}