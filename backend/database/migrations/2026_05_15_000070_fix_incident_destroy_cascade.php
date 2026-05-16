<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // No aplica cambios de esquema; el fix principal se implementa en el backend
        // dentro de IncidentController@destroy para evitar depender 100% de la FK.
    }

    public function down(): void
    {
        // noop
    }
};

