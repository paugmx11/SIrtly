#!/usr/bin/env php
<?php
/**
 * End-to-end Test Script for Incident Management System
 * Tests the complete workflow: create -> assign -> take -> comment -> delete
 */

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\IncidentAttachment;
use App\Models\Comment;
use App\Models\Company;
use Illuminate\Support\Facades\Storage;

echo "\n========== SIRTLY END-TO-END TEST ==========\n\n";

// Get or create test company
$company = Company::firstOrCreate(
    ['cif' => 'TEST-CIF-001'],
    [
        'name' => 'Test Company',
        'email' => 'test@company.com',
        'phone' => '123456789',
        'status' => 'active',
    ]
);
echo "✓ Test Company: {$company->name} (ID: {$company->id})\n";

// Get roles
$empleadoRole = \App\Models\Role::where('name', 'empleado')->first();
$tecnicoRole = \App\Models\Role::where('name', 'tecnico')->first();
$jefeRole = \App\Models\Role::where('name', 'jefe_empresa')->first();

if (!$empleadoRole || !$tecnicoRole || !$jefeRole) {
    echo "✗ ERROR: Required roles not found in database\n";
    exit(1);
}

// Create test users
$empleado = User::firstOrCreate(
    ['email' => 'empleado@test.com'],
    [
        'name' => 'Test',
        'last_name' => 'Employee',
        'company_id' => $company->id,
        'role_id' => $empleadoRole->id,
        'active' => true,
        'password' => bcrypt('password123'),
    ]
);
echo "✓ Test Employee: {$empleado->name} (ID: {$empleado->id})\n";

$tecnico = User::firstOrCreate(
    ['email' => 'tecnico@test.com'],
    [
        'name' => 'Test',
        'last_name' => 'Technician',
        'company_id' => $company->id,
        'role_id' => $tecnicoRole->id,
        'active' => true,
        'password' => bcrypt('password123'),
    ]
);
echo "✓ Test Technician: {$tecnico->name} (ID: {$tecnico->id})\n";

$jefe = User::firstOrCreate(
    ['email' => 'jefe@test.com'],
    [
        'name' => 'Test',
        'last_name' => 'Boss',
        'company_id' => $company->id,
        'role_id' => $jefeRole->id,
        'active' => true,
        'password' => bcrypt('password123'),
    ]
);
echo "✓ Test Boss: {$jefe->name} (ID: {$jefe->id})\n\n";

// Get or create default status
$defaultStatus = IncidentStatus::where('name', 'abierta')->first();
if (!$defaultStatus) {
    $defaultStatus = IncidentStatus::create(['name' => 'abierta']);
    echo "✓ Created default status: abierta\n";
} else {
    echo "✓ Using existing status: {$defaultStatus->name}\n";
}

// PHASE 1: Employee creates incident
echo "\n--- PHASE 1: Employee Creates Incident ---\n";
$incident = Incident::create([
    'company_id' => $company->id,
    'created_by' => $empleado->id,
    'status_id' => $defaultStatus->id,
    'title' => 'Test Incident',
    'description' => 'This is a test incident for E2E testing',
    'category' => 'Hardware',
    'priority' => 'high',
]);
echo "✓ Incident created: {$incident->title} (ID: {$incident->id})\n";
echo "  - Created by: {$incident->creator->name}\n";
echo "  - Status: {$incident->status->name}\n";
echo "  - Assigned to: " . ($incident->assigned_to ? $incident->assignee->name : "Unassigned") . "\n";

// Add attachment
echo "\n--- Add Attachment ---\n";
$testContent = "Test file content for incident attachment";
$testFilePath = 'test_attachment_' . time() . '.txt';
Storage::disk('public')->put('attachments/' . $testFilePath, $testContent);

$attachment = IncidentAttachment::create([
    'incident_id' => $incident->id,
    'file_path' => 'attachments/' . $testFilePath,
    'uploaded_by' => $empleado->id,
]);
echo "✓ Attachment created: {$attachment->file_path} (ID: {$attachment->id})\n";

// Verify attachment can be loaded
$incident->load('attachments');
echo "✓ Loaded {$incident->attachments->count()} attachment(s) from incident\n";

// PHASE 2: Boss assigns technician
echo "\n--- PHASE 2: Boss Assigns Technician ---\n";
$incident->update(['assigned_to' => $tecnico->id]);
$incident->refresh();
echo "✓ Incident assigned to: {$incident->assignee->name}\n";

// PHASE 3: Technician views available incidents
echo "\n--- PHASE 3: Technician Views Available Incidents ---\n";
$availableForTecnico = Incident::where('company_id', $company->id)
    ->where(function ($q) use ($tecnico) {
        $q->whereNull('assigned_to')
          ->orWhere('assigned_to', $tecnico->id);
    })
    ->get();

echo "✓ Technician sees " . count($availableForTecnico) . " incident(s)\n";
if ($availableForTecnico->contains($incident->id)) {
    echo "✓ Test incident is visible to technician\n";
} else {
    echo "✗ ERROR: Test incident NOT visible to technician!\n";
    exit(1);
}

// PHASE 4: Technician takes incident (self-assign)
echo "\n--- PHASE 4: Technician Takes Incident ---\n";
$incident->update(['assigned_to' => $tecnico->id]);
$incident->refresh();
echo "✓ Incident still assigned to: {$incident->assignee->name}\n";

// PHASE 5: Add comment
echo "\n--- PHASE 5: Add Comment ---\n";
$comment = Comment::create([
    'incident_id' => $incident->id,
    'user_id' => $tecnico->id,
    'comment' => 'Working on this issue',
]);
echo "✓ Comment created (ID: {$comment->id})\n";
echo "  - Author: {$comment->user->name}\n";
echo "  - Text: {$comment->comment}\n";

// Verify comment can be loaded
$incident->load('comments');
echo "✓ Loaded {$incident->comments->count()} comment(s) from incident\n";

// PHASE 6: Delete incident (critical test for CASCADE delete)
echo "\n--- PHASE 6: Delete Incident (CASCADE Test) ---\n";
$incidentId = $incident->id;
$attachmentCount = $incident->attachments->count();
$commentCount = $incident->comments->count();

try {
    $incident->delete();
    echo "✓ Incident deleted successfully\n";
    echo "  - Also deleted $attachmentCount attachment(s)\n";
    echo "  - Also deleted $commentCount comment(s)\n";
} catch (\Exception $e) {
    echo "✗ ERROR deleting incident: " . $e->getMessage() . "\n";
    exit(1);
}

// Verify cascade delete worked
$deletedIncident = Incident::find($incidentId);
$deletedAttachments = IncidentAttachment::where('incident_id', $incidentId)->count();
$deletedComments = Comment::where('incident_id', $incidentId)->count();

if ($deletedIncident === null && $deletedAttachments === 0 && $deletedComments === 0) {
    echo "✓ CASCADE delete verified: All related records deleted\n";
} else {
    echo "✗ ERROR: CASCADE delete incomplete!\n";
    echo "  - Incident exists: " . ($deletedIncident ? 'YES' : 'NO') . "\n";
    echo "  - Orphaned attachments: $deletedAttachments\n";
    echo "  - Orphaned comments: $deletedComments\n";
    exit(1);
}

echo "\n========== ALL TESTS PASSED ✓ ==========\n\n";
