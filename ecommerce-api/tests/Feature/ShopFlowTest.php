<?php

namespace Tests\Feature;

use App\Listeners\SendInvoiceEmail;
use App\Mail\InvoiceMail;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Database\Seeders\CatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
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

    public function test_product_listing_includes_variants_with_stock(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'images', 'variants' => [['id', 'sku', 'price', 'stock']]]]]);
    }

    public function test_parent_category_filter_includes_sub_categories(): void
    {
        $child = \App\Models\Category::findOrFail($this->variant->product->category_id);
        $parent = \App\Models\Category::create(['name' => 'World', 'slug' => 'world-test']);
        $child->update(['parent_id' => $parent->id]);

        $this->getJson("/api/products?category_id={$parent->id}")
            ->assertOk()
            ->assertJsonPath('data.0.id', $this->variant->product_id);

        // A leaf category still matches only itself.
        $this->getJson("/api/products?category_id={$child->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_per_page_is_capped(): void
    {
        $this->getJson('/api/products?per_page=500')->assertOk()->assertJsonPath('meta.per_page', 50);
        $this->getJson('/api/products?per_page=2')->assertOk()->assertJsonPath('meta.per_page', 2);
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

        $this->getJson("/api/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'paid')
            ->assertJsonPath('data.payment.method', 'card');

        $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('data.0.payment.status', 'paid');

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

    public function test_password_policy_requires_letters_and_numbers(): void
    {
        foreach (['12345678', 'onlyletters', 'short1'] as $weak) {
            $this->postJson('/api/auth/register', [
                'name' => 'Weak Password',
                'email' => "weak-{$weak}@example.com",
                'password' => $weak,
                'password_confirmation' => $weak,
                'device_name' => 'test',
            ])->assertUnprocessable()->assertJsonValidationErrors('password');
        }

        $user = User::factory()->create(['password' => 'Password123']);
        Sanctum::actingAs($user);

        $this->putJson('/api/auth/change-password', [
            'current_password' => 'Password123',
            'password' => '87654321',
            'password_confirmation' => '87654321',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_unverified_user_cannot_place_an_order(): void
    {
        Sanctum::actingAs(User::factory()->unverified()->create());

        $this->postJson('/api/cart', [
            'product_variant_id' => $this->variant->id,
            'quantity' => 1,
        ])->assertOk();

        $this->postJson('/api/orders', $this->shipping())->assertForbidden();

        $this->assertSame(20, $this->stock());
    }

    public function test_inactive_product_is_hidden_from_the_public_but_not_from_admins(): void
    {
        $product = $this->variant->product;
        $product->update(['is_active' => false]);

        $this->getJson("/api/products/{$product->id}")->assertNotFound();
        $this->getJson('/api/products?is_active=0')->assertOk()->assertJsonPath('meta.total', 0);

        Sanctum::actingAs(User::factory()->create());
        $this->postJson('/api/cart', [
            'product_variant_id' => $this->variant->id,
            'quantity' => 1,
        ])->assertUnprocessable();

        Sanctum::actingAs($this->admin());
        $this->getJson("/api/products/{$product->id}")->assertOk();
        $this->getJson('/api/products?is_active=0')->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_inventory_update_is_recorded_as_a_stock_movement(): void
    {
        Sanctum::actingAs($this->admin());

        $inventory = Inventory::where('product_variant_id', $this->variant->id)->firstOrFail();

        $this->putJson("/api/inventories/{$inventory->id}", ['quantity' => 7, 'low_stock_threshold' => 3])
            ->assertOk()
            ->assertJsonPath('data.quantity', 7);

        $movement = StockMovement::where('product_variant_id', $this->variant->id)->latest('id')->firstOrFail();
        $this->assertSame(StockMovement::TYPE_ADJUSTMENT, $movement->type);
        $this->assertSame(20, $movement->quantity_before);
        $this->assertSame(7, $movement->quantity);
        $this->assertSame(3, $inventory->fresh()->low_stock_threshold);
    }

    public function test_categories_accept_a_capped_page_size(): void
    {
        $this->getJson('/api/categories?per_page=100')->assertOk()->assertJsonPath('meta.per_page', 100);
        $this->getJson('/api/categories?per_page=5000')->assertOk()->assertJsonPath('meta.per_page', 100);
    }

    public function test_api_sends_security_headers_and_restricts_cors(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Referrer-Policy', 'no-referrer');

        // Another site is never echoed back, so browsers refuse to share the response with it.
        $evil = $this->getJson('/api/products', ['Origin' => 'https://evil.example']);
        $this->assertNotSame('https://evil.example', $evil->headers->get('Access-Control-Allow-Origin'));
        $this->assertNotSame('*', $evil->headers->get('Access-Control-Allow-Origin'));

        $this->getJson('/api/products', ['Origin' => config('app.frontend_url')])
            ->assertHeader('Access-Control-Allow-Origin', config('app.frontend_url'));
    }

    public function test_api_tokens_expire(): void
    {
        $this->assertSame(60 * 24 * 7, (int) config('sanctum.expiration'));
    }

    public function test_verification_link_redirects_browsers_and_answers_api_clients(): void
    {
        $user = User::factory()->unverified()->create();

        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
            'id' => $user->id,
            'hash' => sha1($user->email),
        ]);

        $this->get($url, ['Accept' => 'text/html'])
            ->assertRedirect(config('app.frontend_url') . '/account?verified=1');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());

        $this->getJson($url)->assertOk()->assertJsonPath('success', true);
    }

    public function test_forgot_password_does_not_reveal_whether_an_email_exists(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        $known = $this->postJson('/api/auth/forgot-password', ['email' => $user->email])->assertOk();
        $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();

        $this->assertSame($known->json('message'), $unknown->json('message'));
        Notification::assertSentTo($user, ResetPassword::class);
        Notification::assertCount(1);
    }

    public function test_registration_survives_a_mail_outage(): void
    {
        Notification::shouldReceive('send')->andThrow(new \RuntimeException('SMTP down'));

        $this->postJson('/api/auth/register', [
            'name' => 'Mail Outage',
            'email' => 'outage@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'device_name' => 'test',
        ])->assertCreated()->assertJsonStructure(['data' => ['token']]);

        $this->assertDatabaseHas('users', ['email' => 'outage@example.com']);
    }
}
