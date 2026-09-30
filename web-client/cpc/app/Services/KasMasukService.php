<?php

namespace App\Services;

use App\Models\KasMasuk;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class KasMasukService
{
    public function create(array $data): KasMasuk
    {
        return DB::transaction(function () use ($data) {
            $tanggal = Carbon::parse($data['tanggal']);

            return KasMasuk::create([
                'tanggal' => $tanggal,
                'akun_referensi_id' => $data['akun_referensi_id'],
                'keterangan' => $data['keterangan'] ?? null,
                'nominal' => $data['nominal'],
                'dari' => $data['dari'] ?? 'Tidak disebutkan',
                'untuk' => $data['untuk'] ?? 'Kas Proyek SiteFlow',
                'minggu_ke' => (int) $tanggal->format('W'),
                'created_by' => Auth::id(),
            ]);
        });
    }

    public function update(KasMasuk $kasMasuk, array $data): KasMasuk
    {
        return DB::transaction(function () use ($kasMasuk, $data) {
            $tanggal = Carbon::parse($data['tanggal']);

            $kasMasuk->update([
                'tanggal' => $tanggal,
                'akun_referensi_id' => $data['akun_referensi_id'],
                'keterangan' => $data['keterangan'] ?? null,
                'nominal' => $data['nominal'],
                'dari' => $data['dari'] ?? 'Tidak disebutkan',
                'untuk' => $data['untuk'] ?? 'Kas Proyek SiteFlow',
                'minggu_ke' => (int) $tanggal->format('W'),
            ]);

            return $kasMasuk;
        });
    }

    public function delete(KasMasuk $kasMasuk): void
    {
        DB::transaction(function () use ($kasMasuk) {
            $kasMasuk->delete();
        });
    }
}