<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    public function test_active_user_can_log_in_and_receive_token(): void
    {
        $user = $this->createUser('admin', [
            'email' => 'admin@sistema.com',
            'password' => bcrypt('asdqwe123'),
            'active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@sistema.com',
            'password' => 'asdqwe123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_inactive_user_cannot_log_in(): void
    {
        $this->createUser('admin', [
            'email' => 'blocked@sistema.com',
            'password' => bcrypt('asdqwe123'),
            'active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'blocked@sistema.com',
            'password' => 'asdqwe123',
        ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'User inactive.']);
    }
}
