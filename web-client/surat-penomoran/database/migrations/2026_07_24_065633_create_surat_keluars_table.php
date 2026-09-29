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
        Schema::create('surat_keluars', function (Blueprint $table) {

            $table->id();
            $table->unsignedBigInteger('surat_masuk_id')->nullable();
            // Nomor surat otomatis
            $table->string('nomor_surat')->unique();

            // Tanggal surat dibuat
            $table->date('tanggal_surat');

            // Jenis surat
            $table->string('jenis_surat');

            // Tujuan surat
            $table->string('tujuan');

            // Perihal surat
            $table->string('perihal');

            // Isi surat
            $table->longText('isi_surat');

            // Lampiran (opsional)
            $table->string('lampiran')->nullable();

            // Nama penandatangan
            $table->string('penandatangan')->nullable();

            // Jabatan penandatangan
            $table->string('jabatan_penandatangan')->nullable();

            // File PDF hasil generate (opsional)
            $table->string('file_surat')->nullable();

            // Status surat
            $table->enum('status', [
                'Draft',
                'Dikirim',
                'Selesai'
            ])->default('Draft');

            // Admin yang membuat surat
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surat_keluars');
    }
};
