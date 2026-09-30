<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress_unit', function (Blueprint $table) {
            $table->id();

            // Relasi ke unit
            $table->foreignId('unit_id')
                  ->constrained('units')
                  ->cascadeOnUpdate()
                  ->cascadeOnDelete();

            // Progress dalam persentase (0–100), sudah integer final
            $table->unsignedTinyInteger('progress_percent')->default(0);

            // Tanggal update progress
            $table->date('tanggal_update')->nullable();

            // Status progress (e.g. 'Berjalan', 'Selesai')
            $table->enum('status', [
                'NOT STARTED',
                'ON PROGRESS',
                'DONE'
            ])->default('NOT STARTED');

            // Info material (ditambahkan via migration 2026_07_14, digabung di sini)
            $table->string('status_material')->nullable();
            $table->json('detail_material')->nullable();

            // Relasi ke user yang mengupdate
            $table->foreignId('updated_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamps();

            $table->index(['unit_id', 'tanggal_update']);
            $table->index('status');
            $table->index('updated_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_unit');
    }
};