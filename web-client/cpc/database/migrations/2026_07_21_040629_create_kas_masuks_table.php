<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kas_masuks')) {
            return;
        }

        Schema::create('kas_masuks', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->foreignId('akun_referensi_id')->constrained('akun_referensis');
            $table->text('keterangan')->nullable();
            $table->decimal('nominal', 15, 2);
            $table->string('dari');
            $table->string('untuk')->default('Kas Proyek SiteFlow');
            $table->unsignedTinyInteger('minggu_ke')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kas_masuks');
    }
};