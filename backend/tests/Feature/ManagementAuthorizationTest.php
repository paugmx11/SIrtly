<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagementAuthorizationTest extends TestCase
{
    public function test_admin_can_create_company_and_company_manager(): void
    {
        $admin = $this->createUser('admin');
        Sanctum::actingAs($admin->load('role'));

        $companyResponse = $this->postJson('/api/companies', [
            'name' => 'New Company',
            'cif' => 'B44556677',
            'email' => 'newcompany@example.com',
            'phone' => '+34 699 123 123',
            'address' => 'Gran Via 1',
            'status' => 'active',
        ]);

        $companyResponse->assertCreated();
        $companyId = $companyResponse->json('company.id');

        $userResponse = $this->postJson('/api/users', [
            'name' => 'Laura',
            'last_name' => 'Manager',
            'email' => 'laura.manager@example.com',
            'password' => 'asdqwe123',
            'role' => 'jefe_empresa',
            'company_id' => $companyId,
            'phone' => '+34 600 111 222',
            'active' => true,
        ]);

        $userResponse->assertCreated()
            ->assertJsonPath('user.company_id', $companyId);
    }

    public function test_company_manager_can_create_employee_but_not_admin(): void
    {
        $company = $this->createCompany();
        $manager = $this->createUser('jefe_empresa', ['company_id' => $company->id]);
        Sanctum::actingAs($manager->load('role'));

        $employeeResponse = $this->postJson('/api/users', [
            'name' => 'Ana',
            'email' => 'ana.employee@example.com',
            'password' => 'asdqwe123',
            'role' => 'empleado',
            'department' => 'Soporte',
        ]);

        $employeeResponse->assertCreated()
            ->assertJsonPath('user.company_id', $company->id);

        $adminResponse = $this->postJson('/api/users', [
            'name' => 'Nope',
            'email' => 'nope.admin@example.com',
            'password' => 'asdqwe123',
            'role' => 'admin',
        ]);

        $adminResponse->assertStatus(403);
    }
}
