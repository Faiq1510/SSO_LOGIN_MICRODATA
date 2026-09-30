<?php
namespace App\Services;

use App\Models\Material;
use App\Models\LogMasukGudang;
use App\Models\LogKeluarHarian;
use Illuminate\Support\Collection;

class StokGudangService
{
    /**
     * Replay semua transaksi masuk & keluar per material secara kronologis
     * untuk menghitung moving average (weighted average cost) & sisa stok.
     *
     * Return: Collection keyed by material_id => ['sisa_stok' => float, 'harga_rata_rata' => float]
     */
    public function hitungMovingAverage(): Collection
    {
        $masuk = LogMasukGudang::query()
            ->select('material_id', 'tanggal', 'qty', 'harga_satuan', 'id')
            ->get()
            ->map(fn($m) => (object) [
                'material_id' => $m->material_id,
                'tanggal'     => $m->tanggal,
                'id'          => $m->id,
                'tipe'        => 'masuk',
                'qty'         => (float) $m->qty,
                'harga'       => (float) $m->harga_satuan,
            ]);

        $keluar = LogKeluarHarian::query()
            ->select('material_id', 'tanggal', 'qty', 'id')
            ->get()
            ->map(fn($k) => (object) [
                'material_id' => $k->material_id,
                'tanggal'     => $k->tanggal,
                'id'          => $k->id,
                'tipe'        => 'keluar',
                'qty'         => (float) $k->qty,
                'harga'       => null,
            ]);

        $transaksiPerMaterial = $masuk->concat($keluar)
            ->sortBy([
                ['tanggal', 'asc'],
                ['id', 'asc'],
            ])
            ->groupBy('material_id');

        $result = collect();

        foreach ($transaksiPerMaterial as $materialId => $items) {
            $sisaStok = 0.0;
            $avgHarga = 0.0;

            foreach ($items as $t) {
                if ($t->tipe === 'masuk') {
                    $totalQtyBaru = $sisaStok + $t->qty;
                    $avgHarga = $totalQtyBaru > 0
                        ? round((($sisaStok * $avgHarga) + ($t->qty * $t->harga)) / $totalQtyBaru, 2)
                        : 0;
                    $sisaStok = $totalQtyBaru;
                } else {
                    $sisaStok -= $t->qty;
                    // avgHarga tetap, tidak berubah saat barang keluar
                }
            }

            $result->put($materialId, [
                'sisa_stok'       => $sisaStok,
                'harga_rata_rata' => $avgHarga,
            ]);
        }

        return $result;
    }

    /**
     * Hitung moving average hanya untuk material tertentu (efisien untuk pagination)
     * @param array $materialIds
     * @return Collection
     */
    public function hitungMovingAverageFor(array $materialIds): Collection
    {
        if (empty($materialIds)) return collect();

        $masuk = LogMasukGudang::query()
            ->select('material_id', 'tanggal', 'qty', 'harga_satuan', 'id')
            ->whereIn('material_id', $materialIds)
            ->get()
            ->map(fn($m) => (object) [
                'material_id' => $m->material_id,
                'tanggal'     => $m->tanggal,
                'id'          => $m->id,
                'tipe'        => 'masuk',
                'qty'         => (float) $m->qty,
                'harga'       => (float) $m->harga_satuan,
            ]);

        $keluar = LogKeluarHarian::query()
            ->select('material_id', 'tanggal', 'qty', 'id')
            ->whereIn('material_id', $materialIds)
            ->get()
            ->map(fn($k) => (object) [
                'material_id' => $k->material_id,
                'tanggal'     => $k->tanggal,
                'id'          => $k->id,
                'tipe'        => 'keluar',
                'qty'         => (float) $k->qty,
                'harga'       => null,
            ]);

        $transaksiPerMaterial = $masuk->concat($keluar)
            ->sortBy([
                ['tanggal', 'asc'],
                ['id', 'asc'],
            ])
            ->groupBy('material_id');

        $result = collect();

        foreach ($transaksiPerMaterial as $materialId => $items) {
            $sisaStok = 0.0;
            $avgHarga = 0.0;

            foreach ($items as $t) {
                if ($t->tipe === 'masuk') {
                    $totalQtyBaru = $sisaStok + $t->qty;
                    $avgHarga = $totalQtyBaru > 0
                        ? round((($sisaStok * $avgHarga) + ($t->qty * $t->harga)) / $totalQtyBaru, 2)
                        : 0;
                    $sisaStok = $totalQtyBaru;
                } else {
                    $sisaStok -= $t->qty;
                }
            }

            $result->put($materialId, [
                'sisa_stok'       => $sisaStok,
                'harga_rata_rata' => $avgHarga,
            ]);
        }

        return $result;
    }

    /**
     * Harga rata-rata berjalan (moving average) untuk 1 material saat ini.
     * Dipakai buat auto-fill harga di Log Keluar.
     */
    public function hargaRataRataMaterial(int $materialId): float
    {
        $data = $this->hitungMovingAverage()->get($materialId);

        return $data['harga_rata_rata'] ?? 0.0;
    }

    public function getStokGudang()
    {
        $movingAvg = $this->hitungMovingAverage();

        return Material::query()
            ->select('materials.*')
            ->selectSub(
                LogMasukGudang::whereColumn('material_id', 'materials.id')
                    ->selectRaw('COALESCE(SUM(qty), 0)'),
                'total_masuk'
            )
            ->selectSub(
                LogKeluarHarian::whereColumn('material_id', 'materials.id')
                    ->selectRaw('COALESCE(SUM(qty), 0)'),
                'total_keluar'
            )
            ->get()
            ->map(function ($m) use ($movingAvg) {
                $data = $movingAvg->get($m->id, [
                    'sisa_stok'       => 0.0,
                    'harga_rata_rata' => 0.0,
                ]);

                return [
                    'material_id'  => $m->id,
                    'kode'         => $m->kode_material,
                    'nama'         => $m->nama_material,
                    'satuan'       => $m->satuan,
                    'total_masuk'  => (float) $m->total_masuk,
                    'total_keluar' => (float) $m->total_keluar,
                    'sisa_stok'    => $data['sisa_stok'],
                    'harga_satuan' => $data['harga_rata_rata'],
                    'nilai_rupiah' => $data['sisa_stok'] * $data['harga_rata_rata'],
                    'is_warning'   => $data['sisa_stok'] <= 0,
                ];
            })
            ->values();
    }

    public function stokMaterial(int $materialId): float
    {
        $masuk = LogMasukGudang::where('material_id', $materialId)->sum('qty');
        $keluar = LogKeluarHarian::where('material_id', $materialId)->sum('qty');

        return $masuk - $keluar;
    }

    public function stokSemuaMaterial()
    {
        return $this->getStokGudang();
    }

    public function ringkasanDashboard()
    {
        return $this->stokSemuaMaterial()->map(function ($m) {
            $persen = $m['total_masuk'] > 0
                ? round(($m['sisa_stok'] / $m['total_masuk']) * 100)
                : 0;

            return [
                'nama'     => $m['nama'],
                'sisaStok' => $m['sisa_stok'],
                'persen'   => max(0, min(100, $persen)),
            ];
        })->values();
    }
}