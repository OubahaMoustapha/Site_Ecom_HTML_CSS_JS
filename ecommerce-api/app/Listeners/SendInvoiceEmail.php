<?php

namespace App\Listeners;

use App\Events\PaymentCompleted;
use App\Mail\InvoiceMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;

class SendInvoiceEmail implements ShouldQueue
{
    /**
     * Number of attempts when running on a real queue worker.
     */
    public int $tries = 3;

    /**
     * Seconds to wait between attempts.
     */
    public int $backoff = 60;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
    }

    /**
     * Queue connection, configured by MAIL_QUEUE_CONNECTION (default: sync).
     */
    public function viaConnection(): string
    {
        return config('queue.mail_connection');
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

        $send = fn () => Mail::to(
            $payment->order->user->email
        )->send(
            new InvoiceMail($payment)
        );

        // On a real worker, let the failure bubble up so the job is retried.
        if (! in_array($this->viaConnection(), ['sync', 'deferred'], true)) {
            $send();

            return;
        }

        // Without a worker there is no retry: log the failure instead of failing the request.
        try {
            $send();
        } catch (\Throwable $exception) {
            report($exception);
        }
    }
}
