<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE akun_referensis DROP CONSTRAINT akun_referensis_tipe_neraca_check");
        DB::statement("ALTER TABLE akun_referensis ADD CONSTRAINT akun_referensis_tipe_neraca_check CHECK (tipe_neraca IN ('modal','pendapatan','beban','pembelian_aset','liabilitas'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE akun_referensis DROP CONSTRAINT akun_referensis_tipe_neraca_check");
        DB::statement("ALTER TABLE akun_referensis ADD CONSTRAINT akun_referensis_tipe_neraca_check CHECK (tipe_neraca IN ('modal','pendapatan','beban','pembelian_aset'))");
    }
};