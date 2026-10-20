<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Events\PaymentCompleted;

class PaymentService
{
    /**
     * Get authenticated user's payments.
     */
    public function getPayments(User $user): Collection
    {
        return Payment::with('order')
            ->whereHas('order', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->latest()
            ->get();
    }

    /**
     * Get single payment.
     */
    public function getPayment(
        User $user,
        Payment $payment
    ): Payment {

        if ($payment->order->user_id !== $user->id) {

            throw ValidationException::withMessages([
                'payment' => [
                    'Payment not found.',
                ],
            ]);

        }

        return $payment->load('order');
    }

    /**
     * Pay an order.
     */
    public function pay(User $user, array $data): Payment
    {
        $order = Order::findOrFail($data['order_id']);

        if ($order->user_id !== $user->id) {

            throw ValidationException::withMessages([
                'order' => [
                    'Order not found.',
                ],
            ]);

        }

        $payment = DB::transaction(function () use ($order, $data) {

            // Lock the order so two concurrent requests cannot pay it twice.
            $order = Order::whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->payment()->exists()) {

                throw ValidationException::withMessages([
                    'payment' => [
                        'Order has already been paid.',
                    ],
                ]);

            }

            if ($order->status !== Order::STATUS_PENDING) {

                throw ValidationException::withMessages([
                    'order' => [
                        "Order cannot be paid while its status is {$order->status}.",
                    ],
                ]);

            }

            $payment = Payment::create([

                'order_id' => $order->id,

                'amount' => $order->total,

                'method' => $data['method'],

                'status' => 'paid',

                'transaction_id' => null,

                'paid_at' => now(),

            ]);
            $order->update([
                'status' => Order::STATUS_PAID,
            ]);

            return $payment;
        });

        $payment->load([
            'order.user',
            'order.items',
        ]);

        // Dispatched after commit so a mail failure cannot roll back the payment.
        event(
            new PaymentCompleted($payment)
        );

        return $payment;
    }
}