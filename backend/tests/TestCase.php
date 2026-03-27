<?php

namespace Tests;

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use PDO;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureTestingDatabaseExists();
        DB::purge(config('database.default'));

        $this->buildSchema();
        $this->seedReferenceData();
    }


    protected function ensureTestingDatabaseExists(): void
    {
        $host = (string) config('database.connections.mysql.host', '127.0.0.1');
        $port = (string) config('database.connections.mysql.port', '3306');
        $database = (string) config('database.connections.mysql.database', 'sirtly_test');
        $username = (string) config('database.connections.mysql.username', 'root');
        $password = (string) config('database.connections.mysql.password', '');

        $pdo = new PDO("mysql:host={$host};port={$port};charset=utf8mb4", $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        $pdo->exec(sprintf('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', $database));

        config(['database.connections.mysql.database' => $database]);
    }

    protected function buildSchema(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ([
            'personal_access_tokens',
            'notifications',
            'incident_attachments',
            'incident_comments',
            'incident_status_history',
            'incidents',
            'incident_status',
            'company_settings',
            'users',
            'roles',
            'companies',
        ] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('cif', 50)->nullable();
            $table->string('email', 150)->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
        });

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->string('name');
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone', 30)->nullable();
            $table->string('department', 120)->nullable();
            $table->string('specialty', 120)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->unique()->constrained('companies')->cascadeOnDelete();
            $table->string('primary_color', 20)->nullable();
            $table->string('secondary_color', 20)->nullable();
            $table->string('logo')->nullable();
            $table->string('system_name', 150)->nullable();
            $table->string('favicon')->nullable();
            $table->string('assignment_mode', 20)->default('manual');
            $table->json('categories')->nullable();
            $table->json('priorities')->nullable();
            $table->json('departments')->nullable();
            $table->json('specialties')->nullable();
            $table->timestamps();
        });

        Schema::create('incident_status', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
        });

        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('status_id')->constrained('incident_status')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('description');
            $table->string('category', 120)->nullable();
            $table->string('priority', 20)->default('medium');
            $table->timestamps();
        });

        Schema::create('incident_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->cascadeOnDelete();
            $table->foreignId('status_id')->constrained('incident_status')->cascadeOnDelete();
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('changed_at')->nullable();
        });

        Schema::create('incident_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('comment');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('incident_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->constrained('incidents')->cascadeOnDelete();
            $table->string('file_path');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('uploaded_at')->nullable();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('title', 255);
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    protected function seedReferenceData(): void
    {
        foreach (['admin', 'supervisor', 'jefe_empresa', 'tecnico', 'empleado'] as $name) {
            Role::firstOrCreate(['name' => $name]);
        }

        foreach (['abierta', 'en_progreso', 'resuelta', 'cerrada'] as $name) {
            IncidentStatus::firstOrCreate(['name' => $name]);
        }
    }

    protected function createCompany(array $attributes = []): Company
    {
        return Company::create(array_merge([
            'name' => 'TechSolutions',
            'cif' => 'B12345678',
            'email' => 'company' . uniqid() . '@example.com',
            'phone' => '+34 612 345 678',
            'address' => 'Calle Mayor 1',
            'status' => 'active',
        ], $attributes));
    }

    protected function createUser(string $roleName, array $attributes = []): User
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        return User::create(array_merge([
            'company_id' => null,
            'role_id' => $role->id,
            'name' => ucfirst($roleName),
            'last_name' => 'Tester',
            'email' => $roleName . uniqid() . '@example.com',
            'password' => Hash::make('asdqwe123'),
            'phone' => null,
            'department' => null,
            'specialty' => null,
            'active' => true,
        ], $attributes));
    }

    protected function createCompanySetting(Company $company, array $attributes = []): CompanySetting
    {
        return CompanySetting::create(array_merge([
            'company_id' => $company->id,
            'primary_color' => '#2D61E5',
            'secondary_color' => '#7C3AED',
            'system_name' => 'Sirtly Company',
            'assignment_mode' => 'manual',
            'categories' => ['Hardware', 'Software', 'Red'],
            'priorities' => ['Baja', 'Media', 'Alta', 'Crítica'],
            'departments' => ['Soporte'],
            'specialties' => ['Redes', 'Software'],
        ], $attributes));
    }

    protected function createIncident(array $attributes = []): Incident
    {
        $company = $attributes['company'] ?? $this->createCompany();
        $creator = $attributes['creator'] ?? $this->createUser('empleado', ['company_id' => $company->id]);
        $status = IncidentStatus::where('name', $attributes['status_name'] ?? 'abierta')->firstOrFail();

        return Incident::create([
            'company_id' => $company->id,
            'created_by' => $creator->id,
            'assigned_to' => $attributes['assigned_to'] ?? null,
            'status_id' => $status->id,
            'title' => $attributes['title'] ?? 'Incidencia test',
            'description' => $attributes['description'] ?? 'Descripcion test',
            'category' => $attributes['category'] ?? 'Software',
            'priority' => $attributes['priority'] ?? 'medium',
        ]);
    }
}
