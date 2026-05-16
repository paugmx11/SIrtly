<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only run if table exists
        if (!Schema::hasTable('incident_attachments')) {
            return;
        }

        // Corrección defensiva: asegurar que incident_attachments.incident_id tiene ON DELETE CASCADE.
        // Esto evita el error 1451 al borrar una incidencia.
        Schema::table('incident_attachments', function (Blueprint $table) {
            // No podemos expresar “drop foreign key by constraint name” con Blueprint.
            // Hacemos la corrección con SQL si la constraint no es la esperada.
        });

        // Buscar constraint actual y reemplazarla.
        $db = DB::select("SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'incident_attachments'
              AND COLUMN_NAME = 'incident_id'
              AND REFERENCED_TABLE_NAME = 'incidents'");

        foreach ($db as $row) {
            $constraint = $row->CONSTRAINT_NAME;
            if ($constraint) {
                DB::statement("ALTER TABLE incident_attachments DROP FOREIGN KEY {$constraint}");
            }
        }

        // Crear la FK con cascade.
        DB::statement('ALTER TABLE incident_attachments
            ADD CONSTRAINT incident_attachments_incident_id_foreign
            FOREIGN KEY (incident_id) REFERENCES incidents(id)
            ON DELETE CASCADE');
    }

    public function down(): void
    {
        // Revertir a RESTRICT/NO ACTION sería específico de la intención.
        // Para evitar inconsistencias, dejamos el “down” como noop.
    }
};

