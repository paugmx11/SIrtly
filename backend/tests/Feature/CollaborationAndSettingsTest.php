<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CollaborationAndSettingsTest extends TestCase
{
    public function test_comment_creation_notifies_assignee_and_creator(): void
    {
        $company = $this->createCompany();
        $employee = $this->createUser('empleado', ['company_id' => $company->id]);
        $technician = $this->createUser('tecnico', ['company_id' => $company->id]);
        $manager = $this->createUser('jefe_empresa', ['company_id' => $company->id]);

        $incident = $this->createIncident([
            'company' => $company,
            'creator' => $employee,
            'assigned_to' => $technician->id,
            'title' => 'Incidencia con comentario',
        ]);

        Sanctum::actingAs($manager->load('role'));

        $response = $this->postJson("/api/incidents/{$incident->id}/comments", [
            'comment' => 'Revisad esta incidencia hoy.',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'type' => 'comment',
            'title' => 'Nuevo comentario',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $technician->id,
            'type' => 'comment',
            'title' => 'Nuevo comentario',
        ]);
    }

    public function test_company_manager_can_update_branding_settings_with_files(): void
    {
        Storage::fake('public');

        $company = $this->createCompany();
        $manager = $this->createUser('jefe_empresa', ['company_id' => $company->id]);
        $this->createCompanySetting($company);

        Sanctum::actingAs($manager->load('role'));

        $response = $this->put('/api/company-settings', [
            'primary_color' => '#1D4ED8',
            'secondary_color' => '#0F766E',
            'system_name' => 'TechSupport Hub',
            'assignment_mode' => 'specialty',
            'categories' => ['Red', 'Software'],
            'priorities' => ['Alta', 'Crítica'],
            'departments' => ['IT', 'Operaciones'],
            'specialties' => ['Redes', 'Backend'],
            'logo_file' => UploadedFile::fake()->image('logo.png'),
            'favicon_file' => UploadedFile::fake()->image('favicon.png', 32, 32),
        ]);

        $response->assertOk()
            ->assertJsonPath('settings.system_name', 'TechSupport Hub')
            ->assertJsonPath('settings.assignment_mode', 'specialty');

        $logoPath = $response->json('settings.logo');
        $faviconPath = $response->json('settings.favicon');

        Storage::disk('public')->assertExists($logoPath);
        Storage::disk('public')->assertExists($faviconPath);
    }
}
