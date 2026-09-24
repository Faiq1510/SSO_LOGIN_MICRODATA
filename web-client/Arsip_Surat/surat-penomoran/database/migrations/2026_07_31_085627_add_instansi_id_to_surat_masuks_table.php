<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surat_masuks', function (Blueprint $table) {
            // Menambahkan kolom instansi_id (nullable agar data surat lama tidak error)
            $table->foreignId('instansi_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('instansis')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('surat_masuks', function (Blueprint $table) {
            $table->dropForeign(['instansi_id']);
            $table->dropColumn('instansi_id');
        });
    }
};