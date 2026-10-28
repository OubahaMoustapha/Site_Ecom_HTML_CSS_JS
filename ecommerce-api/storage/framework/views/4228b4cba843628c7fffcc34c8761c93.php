<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Your Invoice</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color:#333;">

    <h2>Thank you for your purchase!</h2>

    <p>Hello <strong><?php echo e($order->user->name); ?></strong>,</p>

    <p>
        Your payment has been successfully received.
    </p>

    <p>
        <strong>Order #:</strong> <?php echo e($order->id); ?>

        <br>
        <strong>Payment Method:</strong> <?php echo e(ucfirst($payment->method)); ?>

        <br>
        <strong>Total:</strong> $<?php echo e(number_format($order->total, 2)); ?>

    </p>

    <p>
        We've attached your invoice as a PDF to this email.
    </p>

    <br>

    <p>
        Thank you for shopping with us ❤️
    </p>

</body>
</html><?php /**PATH C:\xampp\htdocs\Site_Ecom_HTML_CSS_JS\ecommerce-api\resources\views/emails/invoice.blade.php ENDPATH**/ ?>