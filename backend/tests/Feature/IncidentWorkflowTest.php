<?php

namespace Tests\Feature;

use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\IncidentStatusHistory;
use App\Models\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IncidentWorkflowTest extends TestCase
{
    public function test_auto_assignment_chooses_active_technician_with_lower_workload(): void
    {
        $company = $this->createCompany();
        $this->createCompanySetting($company, ['assignment_mode' => 'auto']);

        $busyTechnician = $this->createUser('tecnico', ['company_id' => $company->id]);
        $freeTechnician = $this->createUser('tecnico', ['company_id' => $company->id]);
        $employee = $this->createUser('empleado', ['company_id' => $company->id]);

        $this->createIncident([
            'company' => $company,
            'creator' => $employee,
            'assigned_to' => $busyTechnician->id,
            'status_name' => 'abierta',
            'title' => 'Already assigned incident',
        ]);

        Sanctum::actingAs($employee->load('role'));

        $response = $this->postJson('/api/incidents', [
            'title' => 'Nueva incidencia auto',
            'description' => 'Descripcion de prueba',
            'category' => 'Software',
            'priority' => 'medium',
        ]);

        $response->assertCreated()
            ->assertJsonPath('incident.assigned_to', $freeTechnician->id);
    }

    public function test_specialty_assignment_prefers_matching_technician(): void
    {
        $company = $this->createCompany();
        $this->createCompanySetting($company, ['assignment_mode' => 'specialty']);

        $networkTechnician = $this->createUser('tecnico', ['company_id' => $company->id, 'specialty' => 'Redes']);
        $softwareTechnician = $this->createUser('tecnico', ['company_id' => $company->id, 'specialty' => 'Software']);
        $employee = $this->createUser('empleado', ['company_id' => $company->id]);

        Sanctum::actingAs($employee->load('role'));

        $response = $this->postJson('/api/incidents', [
            'title' => 'Caida de VPN',
            'description' => 'Problema de red',
            'category' => 'Red',
            'priority' => 'high',
        ]);

        $response->assertCreated()
            ->assertJsonPath('incident.assigned_to', $networkTechnician->id);
    }

    public function test_technician_status_update_creates_history_and_notifications(): void
    {
        $company = $this->createCompany();
        $employee = $this->createUser('empleado', ['company_id' => $company->id]);
        $technician = $this->createUser('tecnico', ['company_id' => $company->id]);

        $incident = $this->createIncident([
            'company' => $company,
            'creator' => $employee,
            'assigned_to' => $technician->id,
            'status_name' => 'abierta',
            'title' => 'Incidencia a resolver',
        ]);

        Sanctum::actingAs($technician->load('role'));

        $response = $this->patchJson("/api/incidents/{$incident->id}/status", [
            'status' => 'resolved',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('incident_status_history', [
            'incident_id' => $incident->id,
            'changed_by' => $technician->id,
            'status_id' => IncidentStatus::where('name', 'resuelta')->value('id'),
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'title' => 'Estado actualizado',
        ]);
    }
}
