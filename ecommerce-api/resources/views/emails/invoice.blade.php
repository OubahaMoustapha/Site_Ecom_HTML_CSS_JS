<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Invoice</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color:#333;">

    <h2>Thank you for your purchase!</h2>

    <p>Hello <strong>{{ $order->user->name }}</strong>,</p>

    <p>
        Your payment has been successfully received.
    </p>

    <p>
        <strong>Order #:</strong> {{ $order->id }}
        <br>
        <strong>Payment Method:</strong> {{ ucfirst($payment->method) }}
        <br>
        <strong>Total:</strong> ${{ number_format($order->total, 2) }}
    </p>

    <p>
        We've attached your invoice as a PDF to this email.
    </p>

    <br>

    <p>
        Thank you for shopping with us ❤️
    </p>

</body>
</html>