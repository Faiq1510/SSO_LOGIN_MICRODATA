<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guard: kolom sudah ada di CREATE TABLE migration yang diperbaiki,
        // jadi skip jika sudah ada (penting untuk RefreshDatabase di test).
        if (Schema::hasColumn('progress_unit', 'status_material')) {
            return;
        }

        Schema::table('progress_unit', function (Blueprint $table) {
            $table->string('status_material')->nullable()->after('status');
            $table->json('detail_material')->nullable()->after('status_material');
        });
    }

    public function down(): void
    {
        Schema::table('progress_unit', function (Blueprint $table) {
            $table->dropColumn(['status_material', 'detail_material']);
        });
    }
};

