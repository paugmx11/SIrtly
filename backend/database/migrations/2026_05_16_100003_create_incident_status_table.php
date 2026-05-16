<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create incident_status table if it doesn't exist
        if (!Schema::hasTable('incident_status')) {
            Schema::create('incident_status', function (Blueprint $table) {
                $table->id();
                $table->string('name', 120)->unique();
            });

            // Seed default statuses
            DB::table('incident_status')->insert([
                ['name' => 'abierta'],
                ['name' => 'en_progreso'],
                ['name' => 'resuelta'],
                ['name' => 'cerrada'],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_status');
    }
};
