<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('akun_referensis', function (Blueprint $table) {
            $table->enum('tipe_akun', ['induk', 'sub'])->default('induk')->after('kategori');
        });

        // Backfill data lama: akun yang sudah punya parent_id dianggap 'sub',
        // sisanya dianggap 'induk'.
        DB::table('akun_referensis')->whereNotNull('parent_id')->update(['tipe_akun' => 'sub']);
    }

    public function down(): void
    {
        Schema::table('akun_referensis', function (Blueprint $table) {
            $table->dropColumn('tipe_akun');
        });
    }
};