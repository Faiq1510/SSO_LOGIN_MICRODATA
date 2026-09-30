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
        Schema::create('matrix_progress', function (Blueprint $table) {

            // Primary Key
            $table->id();

            // Persentase maksimum progress
            $table->unsignedInteger('batas_atas');

            // Contoh: 0-5, 6-10
            $table->string('range_progress', 20);

            // Nama tahap pekerjaan
            $table->string('tahap_pekerjaan', 100);

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->unique('batas_atas');
            $table->index('range_progress');
            $table->index('tahap_pekerjaan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matrix_progress');
    }
};