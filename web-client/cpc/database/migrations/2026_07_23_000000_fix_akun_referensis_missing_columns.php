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
            if (!Schema::hasColumn('akun_referensis', 'deleted_at')) {
                $table->softDeletes();
            }

            if (!Schema::hasColumn('akun_referensis', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('akun_referensis', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('akun_referensis', 'deleted_by')) {
                $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (!Schema::hasColumn('akun_referensis', 'jenis')) {
                $table->enum('jenis', ['masuk', 'keluar'])->default('masuk');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('akun_referensis')) {
            return;
        }

        Schema::table('akun_referensis', function (Blueprint $table) {
            if (Schema::hasColumn('akun_referensis', 'deleted_by')) {
                $table->dropConstrainedForeignId('deleted_by');
            }
            if (Schema::hasColumn('akun_referensis', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }
            if (Schema::hasColumn('akun_referensis', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
            if (Schema::hasColumn('akun_referensis', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
            if (Schema::hasColumn('akun_referensis', 'jenis')) {
                $table->dropColumn('jenis');
            }
        });
    }
};
