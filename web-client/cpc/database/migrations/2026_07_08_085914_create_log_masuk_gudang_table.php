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
        Schema::create('log_masuk_gudang', function (Blueprint $table) {

            // Primary Key
            $table->id();

            // Informasi Transaksi
            $table->date('tanggal');
            $table->string('supplier', 100);

            // Relasi Material
            $table->foreignId('material_id')
                ->constrained('materials')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            // Jumlah Barang
            $table->decimal('qty', 15, 2);

            // Harga
            $table->decimal('harga_satuan', 15, 2);

            // Total Harga
            $table->decimal('total_harga', 15, 2);

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

            $table->index(['material_id', 'tanggal']);
            $table->index('supplier');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_masuk_gudang');
    }
};