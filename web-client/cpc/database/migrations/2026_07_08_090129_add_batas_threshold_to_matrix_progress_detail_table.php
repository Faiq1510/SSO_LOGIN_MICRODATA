<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matrix_progress_detail', function (Blueprint $table) {
             // Ambang batas WARNING (kelipatan dari qty_standar)
             // default 1.00 = kelebihan sedikit aja langsung warning (kaya Pasir, Split, Besi, dll)
             $table->decimal('batas_warning', 5, 2)->default(1.00)->after('qty_standar');
             // Ambang batas BOROS (kelipatan dari qty_standar)
             // default 1.15 = lewat 115% standar baru dianggap boros
            $table->decimal('batas_boros', 5, 2)->default(1.15)->after('batas_warning');
        });
}

    public function down(): void
    {
        Schema::table('matrix_progress_detail', function (Blueprint $table) {
            $table->dropColumn(['batas_warning', 'batas_boros']);
        });
    }
};