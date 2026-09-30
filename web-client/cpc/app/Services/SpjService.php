<?php

namespace App\Services;

use App\Models\KasKeluar;
use App\Models\KasMasuk;
use Illuminate\Support\Collection;

class SpjService
{
   public function getDokumen(?string $awal = null, ?string $akhir = null): Collection
    {
        $saldoAwal = $awal ? $this->getSaldoSebelum($awal) : 0.0;
        $kasMasuk = KasMasuk::with('akunReferensi')
            ->when($awal && $akhir, fn ($q) => $q->whereBetween('tanggal', [$awal, $akhir]))
            ->get()->map(fn ($item) => [
            'tanggal' => $item->tanggal,
            'id' => $item->id,
            'jenis' => 'Penerimaan',
            'prefix' => 'BPT',
            'akun' => $item->akunReferensi?->nama_akun,
            'unit' => null,
            'penerima' => $item->untuk,
            'debit' => (float) $item->nominal,
            'kredit' => 0.0,
            'metode' => 'Transfer',
        ]);

       $kasKeluar = KasKeluar::with('akunReferensi')
            ->when($awal && $akhir, fn ($q) => $q->whereBetween('tanggal', [$awal, $akhir]))
            ->get()->map(fn ($item) => [
            'tanggal' => $item->tanggal,
            'id' => $item->id,
            'jenis' => 'Pengeluaran',
            'prefix' => 'SPJ',
            'akun' => $item->akunReferensi?->nama_akun,
            'unit' => $item->unit,
            'penerima' => $item->penerima,
            'debit' => 0.0,
            'kredit' => (float) $item->total,
            'metode' => ucfirst($item->metode_bayar),
        ]);

        $merged = $kasMasuk->concat($kasKeluar)
            ->sort(function ($a, $b) {
                return $a['tanggal']->eq($b['tanggal'])
                    ? $a['id'] <=> $b['id']
                    : $a['tanggal'] <=> $b['tanggal'];
            })
            ->values();

        $saldo = $saldoAwal;
        $counter = [];

        return $merged->map(function ($item) use (&$saldo, &$counter) {
            $saldo += $item['debit'] - $item['kredit'];

            $periode = $item['tanggal']->format('my'); // contoh: 0526
            $counterKey = $item['prefix'] . '-' . $periode;
            $counter[$counterKey] = ($counter[$counterKey] ?? 0) + 1;

            return [
                'no_dokumen' => sprintf('%s-%s-%03d', $item['prefix'], $periode, $counter[$counterKey]),
                'tanggal' => $item['tanggal']->format('Y-m-d'),
                'jenis' => $item['jenis'],
                'akun' => $item['akun'],
                'unit' => $item['unit'],
                'penerima' => $item['penerima'],
                'debit' => $item['debit'],
                'kredit' => $item['kredit'],
                'metode' => $item['metode'],
                'saldo' => $saldo,
            ];
       })->values();
    }

    public function getSaldoSebelum(string $tanggal): float
    {
        $totalMasuk = KasMasuk::where('tanggal', '<', $tanggal)->sum('nominal');
        $totalKeluar = KasKeluar::where('tanggal', '<', $tanggal)->sum('total');

        return (float) $totalMasuk - (float) $totalKeluar;
    }

    public function getSummary(Collection $dokumen): array
    {
        return [
            'total_dokumen' => $dokumen->count(),
            'jumlah_penerimaan' => $dokumen->where('jenis', 'Penerimaan')->count(),
            'jumlah_pengeluaran' => $dokumen->where('jenis', 'Pengeluaran')->count(),
            'total_nilai_penerimaan' => $dokumen->sum('debit'),
            'total_nilai_pengeluaran' => $dokumen->sum('kredit'),
            'saldo_akhir' => $dokumen->last()['saldo'] ?? 0,
        ];
    }
}