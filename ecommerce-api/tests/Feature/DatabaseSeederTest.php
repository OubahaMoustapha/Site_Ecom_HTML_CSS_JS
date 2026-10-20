<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_admin_can_log_in_and_reach_admin_routes(): void
    {
        $this->seed(DatabaseSeeder::class);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
            'device_name' => 'postman',
        ])->assertOk()->assertJsonPath('data.user.role', User::ROLE_ADMIN)->json('data.token');

        $this->withToken($token)->getJson('/api/inventories')->assertOk()->assertJsonCount(2, 'data');
    }
}
