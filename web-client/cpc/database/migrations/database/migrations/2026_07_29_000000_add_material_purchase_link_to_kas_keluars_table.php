<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kas_keluars', function (Blueprint $table) {
            $table->boolean('is_pembelian_material')->default(false)->after('metode_bayar');
            $table->foreignId('material_id')->nullable()->after('is_pembelian_material')
                ->constrained('materials')->nullOnDelete();
        });

        Schema::table('log_masuk_gudang', function (Blueprint $table) {
            $table->foreignId('kas_keluar_id')->nullable()->after('created_by')
                ->constrained('kas_keluars')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('log_masuk_gudang', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kas_keluar_id');
        });

        Schema::table('kas_keluars', function (Blueprint $table) {
            $table->dropConstrainedForeignId('material_id');
            $table->dropColumn('is_pembelian_material');
        });
    }
};