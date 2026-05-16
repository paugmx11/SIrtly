<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Create incident_comments if it doesn't exist, and it exists as 'comments'
        if (Schema::hasTable('comments') && !Schema::hasTable('incident_comments')) {
            // Rename comments table to incident_comments
            Schema::rename('comments', 'incident_comments');
        } elseif (!Schema::hasTable('incident_comments') && !Schema::hasTable('comments')) {
            // Create incident_comments from scratch
            Schema::create('incident_comments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('incident_id')
                    ->constrained('incidents')
                    ->cascadeOnDelete();
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();
                $table->text('comment');
                $table->timestamps();
            });
            return;
        }

        // Step 2: Fix column name if needed (message -> comment)
        if (Schema::hasTable('incident_comments')) {
            if (Schema::hasColumn('incident_comments', 'message') && !Schema::hasColumn('incident_comments', 'comment')) {
                Schema::table('incident_comments', function (Blueprint $table) {
                    $table->renameColumn('message', 'comment');
                });
            }

            // Step 3: Ensure updated_at exists
            if (!Schema::hasColumn('incident_comments', 'updated_at')) {
                Schema::table('incident_comments', function (Blueprint $table) {
                    $table->timestamp('updated_at')->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        // Revert: rename incident_comments back to comments
        if (Schema::hasTable('incident_comments') && !Schema::hasTable('comments')) {
            Schema::rename('incident_comments', 'comments');
        }

        // Revert column name change
        if (Schema::hasTable('comments') && Schema::hasColumn('comments', 'comment')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->renameColumn('comment', 'message');
            });
        }
    }
};
