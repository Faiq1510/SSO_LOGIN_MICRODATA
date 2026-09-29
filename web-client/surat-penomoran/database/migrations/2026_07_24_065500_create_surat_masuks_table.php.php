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
        Schema::create('surat_masuks', function (Blueprint $table) {

            $table->id();

            // Nomor agenda internal perusahaan
            $table->string('nomor_agenda')->unique();

            // Nomor surat dari pengirim
            $table->string('nomor_surat');

            // Tanggal pada surat
            $table->date('tanggal_surat');

            // Tanggal diterima perusahaan
            $table->date('tanggal_terima');

            // Instansi atau perusahaan pengirim
            $table->string('asal_surat');

            // Jenis surat
            $table->string('jenis_surat');

            // Perihal surat
            $table->string('perihal');

            // Ringkasan isi surat
            $table->text('isi_ringkas')->nullable();

            // Lampiran (contoh: 1 Berkas, 2 Lembar)
            $table->string('lampiran')->nullable();

            // Upload file PDF
            $table->string('file_surat')->nullable();

            // Catatan admin
            $table->text('keterangan')->nullable();

            // Status surat
            $table->enum('status', [
                'Baru',
                'Diproses',
                'Selesai'
            ])->default('Baru');

            // Admin yang menginput surat
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
        Schema::dropIfExists('surat_masuks');
    }
};
