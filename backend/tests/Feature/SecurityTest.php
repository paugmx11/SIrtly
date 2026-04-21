<?php

namespace Tests\Feature;

use App\Models\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    public function test_protected_routes_require_authentication(): void
    {
        $response = $this->getJson('/api/incidents');

        $response->assertStatus(401);
    }

    public function test_non_admin_cannot_create_company(): void
    {
        $supervisor = $this->createUser('supervisor');
        Sanctum::actingAs($supervisor->load('role'));

        $response = $this->postJson('/api/companies', [
            'name' => 'Forbidden Co',
        ]);

        $response->assertStatus(403)
            ->assertJson(['message' => 'Not authorized.']);
    }

    public function test_logout_revokes_current_access_token(): void
    {
        $this->createUser('admin', [
            'email' => 'logout@sistema.com',
            'password' => bcrypt('asdqwe123'),
            'active' => true,
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'logout@sistema.com',
            'password' => 'asdqwe123',
        ])->assertOk();

        $token = $login->json('token');

        $this->postJson('/api/auth/logout', [], [
            'Authorization' => 'Bearer ' . $token,
        ])->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $userA = $this->createUser('empleado', ['company_id' => $this->createCompany()->id]);
        $userB = $this->createUser('empleado', ['company_id' => $userA->company_id]);

        $foreignNotification = Notification::create([
            'user_id' => $userA->id,
            'type' => 'incident',
            'title' => 'Privada',
            'body' => 'Solo para usuario A',
            'read_at' => null,
        ]);

        Sanctum::actingAs($userB->load('role'));

        $response = $this->postJson("/api/notifications/{$foreignNotification->id}/read");

        $response->assertStatus(404);
    }
}
