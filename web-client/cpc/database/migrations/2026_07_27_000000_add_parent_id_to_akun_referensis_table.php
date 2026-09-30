<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('akun_referensis')) {
            return;
        }

        Schema::table('akun_referensis', function (Blueprint $table) {
            if (!Schema::hasColumn('akun_referensis', 'parent_id')) {
                $table->foreignId('parent_id')->nullable()->after('id')->constrained('akun_referensis')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('akun_referensis')) {
            return;
        }

        Schema::table('akun_referensis', function (Blueprint $table) {
            if (Schema::hasColumn('akun_referensis', 'parent_id')) {
                $table->dropColumn('parent_id');
            }
        });
    }
};
