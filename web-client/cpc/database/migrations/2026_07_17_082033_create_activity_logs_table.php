<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('module', 30);      // 'unit', 'progress', 'material_status', dst
            $table->string('action', 20);      // 'create', 'update', 'delete', 'warning', 'boros'
            $table->string('description', 255);
            $table->string('subject_type', 100)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['module', 'created_at']);
            $table->index('read_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};