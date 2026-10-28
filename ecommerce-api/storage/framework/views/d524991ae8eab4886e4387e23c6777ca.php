<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice #<?php echo e($order->id); ?></title>

    <style>

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 13px;
            color: #333;
            margin: 40px;
        }

        h1 {
            margin: 0;
            color: #222;
        }

        h2 {
            margin-bottom: 5px;
        }

        .header {
            border-bottom: 2px solid #444;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .section {
            margin-bottom: 20px;
        }

        table {
            width:100%;
            border-collapse: collapse;
        }

        table th,
        table td {
            border:1px solid #ddd;
            padding:8px;
        }

        table th {
            background:#f2f2f2;
        }

        .text-right {
            text-align:right;
        }

        .total-table {
            width:40%;
            margin-left:auto;
            margin-top:20px;
        }

        .footer{
            margin-top:40px;
            text-align:center;
            color:#777;
            font-size:12px;
        }

    </style>

</head>

<body>

<div class="header">

    <h1>INVOICE</h1>

    <p>
        <strong>Invoice #:</strong> <?php echo e($order->id); ?><br>

        <strong>Date:</strong> <?php echo e($order->created_at->format('Y-m-d H:i')); ?>

    </p>

</div>

<div class="section">

    <h2>Customer</h2>

    <p>

        <strong>Name:</strong>

        <?php echo e($order->user->name); ?>


        <br>

        <strong>Email:</strong>

        <?php echo e($order->user->email); ?>


    </p>

</div>

<?php if($order->shipping_address): ?>

<div class="section">

    <h2>Shipping Address</h2>

    <p>

        <?php echo e($order->shipping_name); ?><br>

        <?php echo e($order->shipping_address); ?><br>

        <?php echo e($order->shipping_city); ?> <?php echo e($order->shipping_postal_code); ?><br>

        <?php echo e($order->shipping_country); ?><br>

        <strong>Phone:</strong> <?php echo e($order->shipping_phone); ?>


    </p>

</div>

<?php endif; ?>

<div class="section">

    <h2>Order Items</h2>

    <table>

        <thead>

        <tr>

            <th>Product</th>

            <th>SKU</th>

            <th class="text-right">Price</th>

            <th class="text-right">Qty</th>

            <th class="text-right">Subtotal</th>

        </tr>

        </thead>

        <tbody>

        <?php $__currentLoopData = $order->items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>

            <tr>

                <td><?php echo e($item->product_name); ?></td>

                <td><?php echo e($item->sku); ?></td>

                <td class="text-right">
                    $<?php echo e(number_format($item->price,2)); ?>

                </td>

                <td class="text-right">
                    <?php echo e($item->quantity); ?>

                </td>

                <td class="text-right">
                    $<?php echo e(number_format($item->subtotal,2)); ?>

                </td>

            </tr>

        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

        </tbody>

    </table>

</div>

<table class="total-table">

    <tr>

        <th>Subtotal</th>

        <td class="text-right">
            $<?php echo e(number_format($order->subtotal,2)); ?>

        </td>

    </tr>

    <tr>

        <th>Total</th>

        <td class="text-right">
            <strong>$<?php echo e(number_format($order->total,2)); ?></strong>
        </td>

    </tr>

    <tr>

        <th>Payment Method</th>

        <td class="text-right">
            <?php echo e(ucfirst($order->payment->method ?? '-')); ?>

        </td>

    </tr>

    <tr>

        <th>Payment Status</th>

        <td class="text-right">
            <?php echo e(ucfirst($order->payment->status ?? 'unpaid')); ?>

        </td>

    </tr>

</table>

<div class="footer">

    Thank you for your purchase ❤️

</div>

</body>
</html><?php /**PATH C:\xampp\htdocs\Site_Ecom_HTML_CSS_JS\ecommerce-api\resources\views/invoices/order.blade.php ENDPATH**/ ?>