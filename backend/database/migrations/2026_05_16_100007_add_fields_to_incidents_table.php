<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            // Add status_id FK if it doesn't exist
            if (!Schema::hasColumn('incidents', 'status_id')) {
                // First, get the default status ID (or create one)
                $defaultStatusId = DB::table('incident_status')->where('name', 'abierta')->value('id');
                if (!$defaultStatusId) {
                    $defaultStatusId = DB::table('incident_status')->insertGetId(['name' => 'abierta']);
                }

                // Add the FK column with default
                $table->foreignId('status_id')->nullable()->constrained('incident_status')->restrictOnDelete();
            }

            // Add category if it doesn't exist
            if (!Schema::hasColumn('incidents', 'category')) {
                $table->string('category', 120)->nullable();
            }

            // Add priority if it doesn't exist
            if (!Schema::hasColumn('incidents', 'priority')) {
                $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            }
        });

        // Step 2: Migrate data from enum status to status_id
        if (Schema::hasColumn('incidents', 'status') && Schema::hasColumn('incidents', 'status_id')) {
            DB::statement('
                UPDATE incidents 
                SET status_id = (
                    SELECT id FROM incident_status 
                    WHERE incident_status.name = CASE 
                        WHEN incidents.status = "open" THEN "abierta"
                        WHEN incidents.status = "in_progress" THEN "en_progreso"
                        WHEN incidents.status = "resolved" THEN "resuelta"
                        ELSE "abierta"
                    END
                )
                WHERE status_id IS NULL
            ');
        }

        // Step 3: Remove old enum status column
        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'status')) {
                $table->dropColumn('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('incidents', function (Blueprint $table) {
            // Restore enum status column
            $table->enum('status', ['open', 'in_progress', 'resolved'])->default('open');
        });

        // Migrate data back from status_id to status
        DB::statement('
            UPDATE incidents 
            SET status = CASE 
                WHEN (SELECT name FROM incident_status WHERE id = incidents.status_id) = "abierta" THEN "open"
                WHEN (SELECT name FROM incident_status WHERE id = incidents.status_id) = "en_progreso" THEN "in_progress"
                WHEN (SELECT name FROM incident_status WHERE id = incidents.status_id) = "resuelta" THEN "resolved"
                ELSE "open"
            END
            WHERE status IS NULL
        ');

        // Drop new columns
        Schema::table('incidents', function (Blueprint $table) {
            if (Schema::hasColumn('incidents', 'status_id')) {
                $table->dropForeignIdFor('incident_status');
                $table->dropColumn('status_id');
            }
            if (Schema::hasColumn('incidents', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('incidents', 'priority')) {
                $table->dropColumn('priority');
            }
        });
    }
};
