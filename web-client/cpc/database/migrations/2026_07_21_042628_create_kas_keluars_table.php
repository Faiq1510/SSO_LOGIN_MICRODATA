<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('kas_keluars')) {
            return;
        }

        Schema::create('kas_keluars', function (Blueprint $table) {
            $table->id();
            $table->date('tanggal');
            $table->foreignId('akun_referensi_id')->constrained('akun_referensis');
            $table->string('unit')->nullable(); // teks bebas: "A1", "Infrastruktur", dll
            $table->text('keterangan')->nullable();
            $table->decimal('qty', 12, 2)->default(1);
            $table->string('satuan')->nullable();
            $table->decimal('nominal_per_unit', 15, 2);
            $table->decimal('total', 15, 2); // qty * nominal_per_unit, dihitung di service
            $table->enum('metode_bayar', ['transfer', 'tunai'])->default('transfer');
            $table->string('penerima')->nullable();
            $table->string('lampiran_path')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kas_keluars');
    }
};