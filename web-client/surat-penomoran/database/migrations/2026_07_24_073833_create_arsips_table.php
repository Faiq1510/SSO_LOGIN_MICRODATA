<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migration.
     */
    public function up(): void
    {
        Schema::create('arsips', function (Blueprint $table) {

            $table->id();

            // Relasi ke surat masuk (opsional)
            $table->foreignId('surat_masuk_id')
                ->nullable()
                ->constrained('surat_masuks')
                ->cascadeOnDelete();

            // Relasi ke surat keluar (opsional)
            $table->foreignId('surat_keluar_id')
                ->nullable()
                ->constrained('surat_keluars')
                ->cascadeOnDelete();

            // Informasi surat
            $table->string('nomor_surat')->unique();

            $table->enum('jenis', [
                'Surat Masuk',
                'Surat Keluar'
            ]);

            $table->string('jenis_surat');

            $table->string('perihal');

            // Asal surat (Surat Masuk) atau Tujuan (Surat Keluar)
            $table->string('pengirim_penerima');

            $table->date('tanggal_surat');

            $table->string('lampiran')->nullable();

            $table->string('file_surat')->nullable();

            $table->enum('status', [
                'Baru',
                'Diproses',
                'Draft',
                'Dikirim',
                'Selesai'
            ]);

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamps();

        });
    }

    /**
     * Batalkan migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('arsips');
    }
};
