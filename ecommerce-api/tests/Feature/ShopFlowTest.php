<?php

namespace Tests\Feature;

use App\Listeners\SendInvoiceEmail;
use App\Mail\InvoiceMail;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ShopFlowTest extends TestCase
{
    use RefreshDatabase;

    private ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CatalogSeeder::class);

        // TSHIRT-S has 20 items in stock.
        $this->variant = ProductVariant::where('sku', 'TSHIRT-S')->firstOrFail();
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => User::ROLE_ADMIN]);
    }

    private function shipping(): array
    {
        return [
            'shipping_name' => 'Test Customer',
            'shipping_phone' => '0600000000',
            'shipping_address' => '1 Demo Street',
            'shipping_city' => 'Casablanca',
            'shipping_country' => 'Morocco',
        ];
    }

    private function placeOrder(User $user, int $quantity = 2): int
    {
        Sanctum::actingAs($user);

        $this->postJson('/api/cart', [
            'product_variant_id' => $this->variant->id,
            'quantity' => $quantity,
        ])->assertOk();

        return $this->postJson('/api/orders', $this->shipping())
            ->assertCreated()
            ->json('data.id');
    }

    private function stock(): int
    {
        return Inventory::where('product_variant_id', $this->variant->id)->value('quantity');
    }

    public function test_catalog_writes_require_admin(): void
    {
        $payload = [
            'name' => 'New Product',
            'slug' => 'new-product',
            'price' => 10,
            'stock' => 0,
        ];

        $this->postJson('/api/products', $payload)->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/products', $payload)->assertForbidden();

        Sanctum::actingAs($this->admin());
        $this->postJson('/api/products', $payload)->assertCreated();
    }

    public function test_inventory_endpoints_require_admin(): void
    {
        $this->getJson('/api/inventories')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/stock-movements')->assertForbidden();
    }

    public function test_guest_without_accept_header_gets_401_not_500(): void
    {
        $this->get('/api/cart')->assertUnauthorized();
    }

    public function test_product_details_include_variants_with_stock(): void
    {
        $productId = $this->variant->product_id;

        $this->getJson("/api/products/{$productId}")
            ->assertOk()
            ->assertJsonPath('data.variants.0.sku', fn ($sku) => in_array($sku, ['TSHIRT-S', 'TSHIRT-M']))
            ->assertJsonStructure(['data' => ['variants' => [['id', 'sku', 'price', 'stock']], 'images']]);
    }

    public function test_checkout_decreases_stock_logs_movement_and_clears_cart(): void
    {
        $user = User::factory()->create();

        $orderId = $this->placeOrder($user, 2);

        $this->assertSame(18, $this->stock());

        $movement = StockMovement::where('product_variant_id', $this->variant->id)->latest('id')->first();
        $this->assertSame(StockMovement::TYPE_OUT, $movement->type);
        $this->assertSame(20, $movement->quantity_before);
        $this->assertSame("Customer order #{$orderId}", $movement->note);

        $this->getJson('/api/cart')->assertJsonPath('data.items_count', 0);

        $this->getJson("/api/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.shipping.city', 'Casablanca')
            ->assertJsonPath('data.status', Order::STATUS_PENDING);
    }

    public function test_order_requires_shipping_details(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/cart', [
            'product_variant_id' => $this->variant->id,
            'quantity' => 1,
        ])->assertOk();

        $this->postJson('/api/orders', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_country']);
    }

    public function test_cart_rejects_quantity_above_stock(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/cart', [
            'product_variant_id' => $this->variant->id,
            'quantity' => 21,
        ])->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    public function test_customer_can_cancel_pending_order_and_stock_is_restored(): void
    {
        $orderId = $this->placeOrder(User::factory()->create(), 3);

        $this->assertSame(17, $this->stock());

        $this->postJson("/api/orders/{$orderId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_CANCELLED);

        $this->assertSame(20, $this->stock());

        $this->postJson("/api/orders/{$orderId}/cancel")->assertUnprocessable();
    }

    public function test_payment_marks_order_paid_sends_invoice_and_cannot_repeat(): void
    {
        Mail::fake();

        $orderId = $this->placeOrder(User::factory()->create());

        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'card'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'paid');

        $this->assertSame(Order::STATUS_PAID, Order::find($orderId)->status);

        Mail::assertSent(InvoiceMail::class);

        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'card'])
            ->assertUnprocessable();
    }

    public function test_cancelled_order_cannot_be_paid(): void
    {
        $orderId = $this->placeOrder(User::factory()->create());

        $this->postJson("/api/orders/{$orderId}/cancel")->assertOk();

        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'cash'])
            ->assertUnprocessable();
    }

    public function test_user_cannot_access_another_users_order(): void
    {
        $orderId = $this->placeOrder(User::factory()->create());

        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/orders/{$orderId}")->assertUnprocessable();
        $this->postJson("/api/orders/{$orderId}/cancel")->assertUnprocessable();
        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'card'])->assertUnprocessable();
    }

    public function test_admin_manages_order_status_transitions(): void
    {
        Mail::fake();

        $orderId = $this->placeOrder(User::factory()->create(), 2);
        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'card'])->assertCreated();

        Sanctum::actingAs($this->admin());

        $this->getJson('/api/admin/orders?status=paid')
            ->assertOk()
            ->assertJsonPath('data.0.id', $orderId);

        $this->patchJson("/api/admin/orders/{$orderId}/status", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');

        // processing -> completed skips "shipped" and is rejected.
        $this->patchJson("/api/admin/orders/{$orderId}/status", ['status' => 'completed'])
            ->assertUnprocessable();

        $this->patchJson("/api/admin/orders/{$orderId}/status", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'refunded');

        $this->assertSame(20, $this->stock());
    }

    public function test_customer_cannot_use_admin_order_endpoints(): void
    {
        $orderId = $this->placeOrder(User::factory()->create());

        $this->getJson('/api/admin/orders')->assertForbidden();
        $this->patchJson("/api/admin/orders/{$orderId}/status", ['status' => 'processing'])->assertForbidden();
    }

    public function test_ordered_variant_cannot_be_deleted(): void
    {
        $this->placeOrder(User::factory()->create());

        Sanctum::actingAs($this->admin());

        $this->deleteJson("/api/product-variants/{$this->variant->id}")->assertConflict();
        $this->deleteJson("/api/products/{$this->variant->product_id}")->assertConflict();
    }

    public function test_stock_out_above_quantity_returns_422(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/stock-movements', [
            'product_variant_id' => $this->variant->id,
            'type' => 'out',
            'quantity' => 999,
        ])->assertUnprocessable()->assertJsonValidationErrors('quantity');
    }

    public function test_login_is_throttled(): void
    {
        User::factory()->create(['email' => 'throttle@example.com']);

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => 'throttle@example.com',
                'password' => 'wrong-password',
                'device_name' => 'postman',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', [
            'email' => 'throttle@example.com',
            'password' => 'wrong-password',
            'device_name' => 'postman',
        ])->assertTooManyRequests();
    }

    public function test_invoice_is_downloaded_as_pdf(): void
    {
        $orderId = $this->placeOrder(User::factory()->create());

        $this->get("/api/orders/{$orderId}/invoice")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_inactive_variant_cannot_be_added_to_cart(): void
    {
        Sanctum::actingAs($this->admin());

        $this->putJson("/api/product-variants/{$this->variant->id}", ['is_active' => false])->assertOk();

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/cart', [
            'product_variant_id' => $this->variant->id,
            'quantity' => 1,
        ])->assertUnprocessable();
    }

    public function test_auth_limit_is_per_email_so_other_users_on_same_ip_are_not_blocked(): void
    {
        User::factory()->create(['email' => 'blocked@example.com']);
        User::factory()->create(['email' => 'other@example.com']);

        $attempt = fn (string $email) => $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'wrong-password',
            'device_name' => 'postman',
        ]);

        for ($i = 0; $i < 6; $i++) {
            $attempt('blocked@example.com')->assertUnprocessable();
        }

        $attempt('blocked@example.com')->assertTooManyRequests();

        // Same IP, different email: still allowed.
        $attempt('other@example.com')->assertUnprocessable();
        $this->postJson('/api/auth/forgot-password', ['email' => 'other@example.com'])->assertOk();
    }

    public function test_auth_limit_caps_many_different_emails_from_one_ip(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/api/auth/login', [
                'email' => "spray{$i}@example.com",
                'password' => 'wrong-password',
                'device_name' => 'postman',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/auth/login', [
            'email' => 'spray-last@example.com',
            'password' => 'wrong-password',
            'device_name' => 'postman',
        ])->assertTooManyRequests();
    }

    public function test_invoice_email_is_queued_when_a_queue_connection_is_configured(): void
    {
        config(['queue.mail_connection' => 'database']);

        Queue::fake();

        $orderId = $this->placeOrder(User::factory()->create());

        $this->postJson('/api/payments', ['order_id' => $orderId, 'method' => 'card'])->assertCreated();

        Queue::assertPushed(
            CallQueuedListener::class,
            fn (CallQueuedListener $job) => $job->class === SendInvoiceEmail::class
        );
    }

    public function test_role_cannot_be_mass_assigned_on_register(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Sneaky User',
            'email' => 'sneaky@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'device_name' => 'postman',
            'role' => 'admin',
        ])->assertCreated()->assertJsonPath('data.user.role', User::ROLE_CUSTOMER);
    }
}
