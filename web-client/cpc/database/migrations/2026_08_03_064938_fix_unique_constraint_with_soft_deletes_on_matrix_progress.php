<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the old unique constraint that doesn't respect soft deletes
        Schema::table('matrix_progress', function (Blueprint $table) {
            $table->dropUnique('matrix_progress_master_batas_unique');
        });

        // Create a partial unique index that only applies to non-deleted rows
        DB::statement('
            CREATE UNIQUE INDEX matrix_progress_master_batas_unique
            ON matrix_progress (master_standar_id, batas_atas)
            WHERE deleted_at IS NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the partial unique index
        DB::statement('DROP INDEX IF EXISTS matrix_progress_master_batas_unique');

        // Restore the original unique constraint
        Schema::table('matrix_progress', function (Blueprint $table) {
            $table->unique(['master_standar_id', 'batas_atas'], 'matrix_progress_master_batas_unique');
        });
    }
};
