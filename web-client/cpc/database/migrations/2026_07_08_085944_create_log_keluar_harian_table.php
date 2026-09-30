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
        Schema::create('log_keluar_harian', function (Blueprint $table) {

            // Primary Key
            $table->id();

            // Tanggal Pengeluaran
            $table->date('tanggal');

            // Unit Tujuan
            $table->foreignId('unit_id')
                ->constrained('units')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Material
            $table->foreignId('material_id')
                ->constrained('materials')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Jumlah Material
            $table->decimal('qty', 15, 2);

            // Harga Material Saat Digunakan
            $table->decimal('harga', 15, 2);

            // Total = qty × harga
            $table->decimal('total', 15, 2);

            // Catatan
            $table->text('keterangan')->nullable();

            // User yang menginput
            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->index(['unit_id', 'material_id', 'tanggal']);
            $table->index('tanggal');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_keluar_harian');
    }
};