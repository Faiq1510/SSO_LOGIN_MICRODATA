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
        Schema::create('materials', function (Blueprint $table) {

            // Primary Key
            $table->id();

            // Data Material
            $table->string('kode_material', 20)->unique();
            $table->string('nama_material', 100);
            $table->string('satuan', 20);
            $table->string('kategori', 50);

            // Harga
            $table->decimal('harga', 15, 2)->default(0);

            // Timestamp
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Index
            |--------------------------------------------------------------------------
            */

            $table->index('nama_material');
            $table->index('kategori');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};