<?php

namespace Database\Seeders;

use App\Models\LogKeluarHarian;
use App\Models\LogMasukGudang;
use App\Models\MatrixProgress;
use App\Models\ProgressUnit;
use App\Models\Unit;
use App\Models\User;
use App\Services\MaterialConsumptionService;
use App\Services\StokGudangService;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ProgressUnitSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@gmail.com')->value('id')
            ?? User::query()->value('id');

        /** @var MaterialConsumptionService $service */
        $service = app(MaterialConsumptionService::class);
        $stokService = app(StokGudangService::class);

        $matrixSorted = MatrixProgress::with('details')->orderBy('batas_atas')->get();

        foreach (Unit::where('status', 'Aktif')->get() as $unit) {
            // target progress akhir tiap unit, biar bervariasi (ada yang selesai, ada yang jalan)
            $targetProgress = collect([25, 45, 65, 85, 100, 100])->random();

            $tanggal = Carbon::parse($unit->tanggal_mulai ?? '2026-01-01');
            $lastMaterialQty = []; // material_id => total qty dipakai sejauh ini

            foreach ($matrixSorted as $tahap) {
                if ($tahap->batas_atas > $targetProgress) {
                    break;
                }

                // Buat log keluar untuk material di tahap ini (simulasikan pemakaian)
                foreach ($tahap->details as $detail) {
                    // variasi: kadang pas standar, kadang melebihi (biar ada Warning/Boros di dashboard)
                    $variasi = collect([0.9, 1.0, 1.05, 1.15, 1.35])->random();
                    $qtyDipakai = round($detail->qty_standar * $variasi, 2);

                    // kurangi qty yang sudah tercatat di tahap sebelumnya, supaya kumulatifnya pas
                    $sudahDipakai = $lastMaterialQty[$detail->material_id] ?? 0;
                    $stokSaatIni = max(0, (float) $stokService->stokMaterial((int) $detail->material_id));
                    $tambahan = max(0, min($qtyDipakai - $sudahDipakai, $stokSaatIni));

                    if ($tambahan > 0) {
                        // Determine harga: prefer material->harga; fallback to latest LogMasukGudang harga_satuan; final fallback a reasonable default
                        $materialHarga = (float) ($detail->material->harga ?? 0);
                        if ($materialHarga <= 0) {
                            $latestHarga = LogMasukGudang::where('material_id', $detail->material_id)
                                ->orderByDesc('tanggal')
                                ->value('harga_satuan');
                            $materialHarga = $latestHarga ? (float) $latestHarga : 150000;
                        }

                        LogKeluarHarian::create([
                            'tanggal'     => $tanggal->toDateString(),
                            'unit_id'     => $unit->id,
                            'material_id' => $detail->material_id,
                            'qty'         => $tambahan,
                            'harga'       => $materialHarga,
                            'total'       => round($tambahan * $materialHarga, 2),
                            'keterangan'  => 'Pemakaian tahap '.$tahap->tahap_pekerjaan,
                            'created_by'  => $adminId,
                        ]);

                        $lastMaterialQty[$detail->material_id] = $sudahDipakai + $tambahan;
                    }
                }

                $tanggal = $tanggal->copy()->addDays(rand(5, 12));

                // Hitung status material via service yang sama dipakai controller
                $hasil = $service->evaluasiUnit($unit, (float) $tahap->batas_atas);

                $status = match (true) {
                    $tahap->batas_atas >= 100 => 'DONE',
                    default => 'ON PROGRESS',
                };

                ProgressUnit::create([
                    'unit_id'          => $unit->id,
                    'progress_percent' => $tahap->batas_atas,
                    'tanggal_update'   => $tanggal->toDateString(),
                    'status'           => $status,
                    'updated_by'       => $adminId,
                    'status_material'  => strtoupper($hasil['status']),
                    'detail_material'  => $hasil['detail'],
                ]);
            }
        }
    }
}