<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migration.
     * Menambahkan kolom yang dibutuhkan halaman Kelola Users
     * ke tabel users bawaan (Breeze/Fortify).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('Viewer')->after('email');
            $table->string('unit_kerja')->nullable()->after('role');
            $table->enum('status', ['Aktif', 'Nonaktif'])->default('Aktif')->after('unit_kerja');
        });
    }

    /**
     * Batalkan migration.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'unit_kerja', 'status']);
        });
    }
};