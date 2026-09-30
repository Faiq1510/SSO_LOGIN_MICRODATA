<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_menu_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // menu_key = route name dari menu, contoh: 'unit.index', 'gudang.index', 'finance.kas-masuk'
            $table->string('menu_key');
            // visible = true  → paksa tampilkan meskipun role tidak include menu ini
            // visible = false → paksa sembunyikan meskipun role include menu ini
            $table->boolean('visible');
            $table->timestamps();

            $table->unique(['user_id', 'menu_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_menu_overrides');
    }
};
