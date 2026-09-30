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
        Schema::create('log_gudang_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('tipe_log'); // 'masuk' atau 'keluar'
            $table->unsignedBigInteger('log_id');
            $table->string('action'); // 'create', 'update', 'delete'
            $table->json('data_lama')->nullable();
            $table->json('data_baru')->nullable();
            $table->timestamps();

            $table->index(['tipe_log', 'log_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_gudang_histories');
    }
};
