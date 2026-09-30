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
        Schema::create('units', function (Blueprint $table) {

            // Primary Key
            $table->id();

            // Informasi Unit
            $table->string('nama_unit', 50)->unique();
            $table->string('zona', 20);
            $table->string('status', 20)->default('Aktif');
            $table->string('tukang', 100);

            // Tanggal Mulai Pembangunan
            $table->date('tanggal_mulai')->nullable();

            // Keterangan Tambahan
            $table->text('keterangan')->nullable();

            // Timestamp Laravel
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->index('zona');
            $table->index('status');
            $table->index('tanggal_mulai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};