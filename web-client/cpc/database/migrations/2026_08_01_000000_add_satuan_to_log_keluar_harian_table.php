<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('log_keluar_harian', function (Blueprint $table) {
            $table->string('satuan', 20)->nullable()->after('qty');
        });
    }

    public function down(): void
    {
        Schema::table('log_keluar_harian', function (Blueprint $table) {
            $table->dropColumn('satuan');
        });
    }
};