<?php

namespace Tests\Unit;

use App\Models\CompanySetting;
use App\Models\Incident;
use App\Models\Notification;
use PHPUnit\Framework\TestCase;

class DomainModelsTest extends TestCase
{
    public function test_incident_uses_expected_table_and_fillable_fields(): void
    {
        $incident = new Incident();

        $this->assertSame('incidents', $incident->getTable());
        $this->assertContains('company_id', $incident->getFillable());
        $this->assertContains('created_by', $incident->getFillable());
        $this->assertContains('assigned_to', $incident->getFillable());
        $this->assertContains('status_id', $incident->getFillable());
        $this->assertContains('priority', $incident->getFillable());
    }

    public function test_company_setting_casts_json_like_fields_to_arrays(): void
    {
        $settings = new CompanySetting();
        $settings->setRawAttributes([
            'categories' => '["Hardware","Software"]',
            'priorities' => '["Baja","Alta"]',
        ], true);

        $this->assertIsArray($settings->categories);
        $this->assertSame(['Hardware', 'Software'], $settings->categories);
        $this->assertSame(['Baja', 'Alta'], $settings->priorities);
    }

    public function test_notification_model_configuration_is_correct(): void
    {
        $notification = new Notification();

        $this->assertSame('datetime', $notification->getCasts()['read_at'] ?? null);
        $this->assertFalse($notification->timestamps);
    }
}
