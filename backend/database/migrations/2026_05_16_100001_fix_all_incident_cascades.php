<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only run if tables exist
        if (!Schema::hasTable('incident_status_history') && !Schema::hasTable('incident_attachments')) {
            return;
        }

        // Arreglar FK en incident_status_history
        if (Schema::hasTable('incident_status_history')) {
            DB::statement("ALTER TABLE incident_status_history DROP FOREIGN KEY incident_status_history_ibfk_1");
            DB::statement("ALTER TABLE incident_status_history ADD CONSTRAINT incident_status_history_incident_id_foreign FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE");
        }
        
        // Arreglar FK en incident_attachments si es necesario
        if (Schema::hasTable('incident_attachments') && $this->hasConstraint('incident_attachments', 'incident_attachments_ibfk_1')) {
            DB::statement("ALTER TABLE incident_attachments DROP FOREIGN KEY incident_attachments_ibfk_1");
            DB::statement("ALTER TABLE incident_attachments ADD CONSTRAINT incident_attachments_incident_id_foreign FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE");
        }
    }

    public function down(): void
    {
        // Revertir
        DB::statement("ALTER TABLE incident_status_history DROP FOREIGN KEY incident_status_history_incident_id_foreign");
        DB::statement("ALTER TABLE incident_status_history ADD CONSTRAINT incident_status_history_ibfk_1 FOREIGN KEY (incident_id) REFERENCES incidents(id)");
    }

    private function hasConstraint($table, $constraint)
    {
        $result = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?", [$table, $constraint]);
        return !empty($result);
    }
};
