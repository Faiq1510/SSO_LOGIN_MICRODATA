<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE akun_referensi_histories DROP CONSTRAINT akun_referensi_histories_aksi_check');
        DB::statement("ALTER TABLE akun_referensi_histories ADD CONSTRAINT akun_referensi_histories_aksi_check CHECK (aksi IN ('ditambahkan', 'diedit', 'dihapus', 'dipulihkan'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE akun_referensi_histories DROP CONSTRAINT akun_referensi_histories_aksi_check');
        DB::statement("ALTER TABLE akun_referensi_histories ADD CONSTRAINT akun_referensi_histories_aksi_check CHECK (aksi IN ('ditambahkan', 'diedit', 'dihapus'))");
    }
};