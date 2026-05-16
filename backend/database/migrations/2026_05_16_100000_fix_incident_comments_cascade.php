<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar la FK antigua RESTRICT y crear una con CASCADE
        // Only run if table exists
        if (Schema::hasTable('incident_comments')) {
            DB::statement("ALTER TABLE incident_comments DROP FOREIGN KEY incident_comments_ibfk_1");
            DB::statement("ALTER TABLE incident_comments ADD CONSTRAINT incident_comments_incident_id_foreign FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE");
        }
    }

    public function down(): void
    {
        // Revertir a RESTRICT
        DB::statement("ALTER TABLE incident_comments DROP FOREIGN KEY incident_comments_incident_id_foreign");
        DB::statement("ALTER TABLE incident_comments ADD CONSTRAINT incident_comments_ibfk_1 FOREIGN KEY (incident_id) REFERENCES incidents(id)");
    }
};
