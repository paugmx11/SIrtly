<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('incident_attachments')) {
            Schema::create('incident_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('incident_id')
                    ->constrained('incidents')
                    ->cascadeOnDelete();
                $table->string('file_path');
                $table->foreignId('uploaded_by')
                    ->constrained('users')
                    ->cascadeOnDelete();
                $table->timestamp('uploaded_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_attachments');
    }
};
