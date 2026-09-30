<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('matrix_progress_detail', function (Blueprint $table) {

            // Primary Key
            $table->id();

            // Relasi ke matrix_progress
            $table->foreignId('matrix_id')
                ->constrained('matrix_progress')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Relasi ke materials
            $table->foreignId('material_id')
                ->constrained('materials')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Jumlah standar material
            $table->decimal('qty_standar', 15, 2);

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Constraint
            |--------------------------------------------------------------------------
            */

            // Satu material hanya boleh muncul sekali dalam satu tahap progress
            $table->unique(['matrix_id', 'material_id']);

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->index('matrix_id');
            $table->index('material_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matrix_progress_detail');
    }
};