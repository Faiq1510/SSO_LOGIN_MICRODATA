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
        Schema::table('surat_masuks', function (Blueprint $table) {
            $table->string('nama_petugas')->nullable()->after('status');
            $table->string('jabatan_petugas')->nullable()->after('nama_petugas');
            $table->string('nama_pimpinan')->nullable()->after('jabatan_petugas');
            $table->string('jabatan_pimpinan')->nullable()->after('nama_pimpinan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('surat_masuks', function (Blueprint $table) {
            $table->dropColumn(['nama_petugas', 'jabatan_petugas', 'nama_pimpinan', 'jabatan_pimpinan']);
        });
    }
};
