<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matrix_progress', function (Blueprint $table) {
            // Drop unique batas_atas
            $table->dropUnique('matrix_progress_batas_atas_unique');
            
            // Add unique composite (master_standar_id, batas_atas)
            $table->unique(['master_standar_id', 'batas_atas'], 'matrix_progress_master_batas_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matrix_progress', function (Blueprint $table) {
            $table->dropUnique('matrix_progress_master_batas_unique');
            $table->unique('batas_atas', 'matrix_progress_batas_atas_unique');
        });
    }
};
