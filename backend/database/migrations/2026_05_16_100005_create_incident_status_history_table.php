<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('incident_status_history')) {
            Schema::create('incident_status_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('incident_id')
                    ->constrained('incidents')
                    ->cascadeOnDelete();
                $table->foreignId('status_id')
                    ->constrained('incident_status')
                    ->restrictOnDelete();
                $table->foreignId('changed_by')
                    ->constrained('users')
                    ->cascadeOnDelete();
                $table->timestamp('changed_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_status_history');
    }
};
