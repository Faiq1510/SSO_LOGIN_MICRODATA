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
        Schema::create('master_standar_progress', function (Blueprint $table) {
            $table->id();
            $table->string('nama_standar');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        // Insert default standar
        $defaultId = DB::table('master_standar_progress')->insertGetId([
            'nama_standar' => 'Standar Default (Lama)',
            'deskripsi' => 'Standar progress awal sistem sebelum ada fitur multi-standar.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Schema::table('matrix_progress', function (Blueprint $table) use ($defaultId) {
            $table->foreignId('master_standar_id')->default($defaultId)->after('id')
                  ->constrained('master_standar_progress')->cascadeOnUpdate()->restrictOnDelete();
        });

        Schema::table('units', function (Blueprint $table) use ($defaultId) {
            $table->foreignId('master_standar_id')->default($defaultId)->after('keterangan')
                  ->constrained('master_standar_progress')->cascadeOnUpdate()->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropForeign(['master_standar_id']);
            $table->dropColumn('master_standar_id');
        });

        Schema::table('matrix_progress', function (Blueprint $table) {
            $table->dropForeign(['master_standar_id']);
            $table->dropColumn('master_standar_id');
        });

        Schema::dropIfExists('master_standar_progress');
    }
};
