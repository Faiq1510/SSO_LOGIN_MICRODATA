<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('akun_referensis')) {
            return;
        }

        Schema::create('akun_referensis', function (Blueprint $table) {
            $table->id();
            $table->string('kode_akun', 20)->unique();
            $table->string('nama_akun', 255);
            $table->string('kategori', 50);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('akun_referensis');
    }
};
