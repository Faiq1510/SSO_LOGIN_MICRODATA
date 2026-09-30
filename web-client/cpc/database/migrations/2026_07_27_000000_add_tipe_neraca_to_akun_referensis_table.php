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
            if (!Schema::hasColumn('akun_referensis', 'tipe_neraca')) {
                // modal            = setoran modal owner (nambah Modal langsung)
                // pendapatan       = termin klien, penjualan unit, dll (nambah Laba/Rugi Berjalan)
                // beban            = upah, sewa alat, operasional (ngurangin Laba/Rugi Berjalan)
                // pembelian_aset   = beli material: uang -> persediaan, TIDAK dianggap beban
                $table->enum('tipe_neraca', ['modal', 'pendapatan', 'beban', 'pembelian_aset'])
                    ->default('beban')
                    ->after('kategori');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('akun_referensis')) {
            return;
        }

        Schema::table('akun_referensis', function (Blueprint $table) {
            if (Schema::hasColumn('akun_referensis', 'tipe_neraca')) {
                $table->dropColumn('tipe_neraca');
            }
        });
    }
};
