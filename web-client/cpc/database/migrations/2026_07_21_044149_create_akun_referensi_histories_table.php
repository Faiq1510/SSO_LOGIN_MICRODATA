<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('akun_referensi_histories')) {
            return;
        }

        Schema::create('akun_referensi_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('akun_referensi_id')->constrained('akun_referensis')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('aksi', ['ditambahkan', 'diedit', 'dihapus']);
            $table->json('detail')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('akun_referensi_histories');
    }
};