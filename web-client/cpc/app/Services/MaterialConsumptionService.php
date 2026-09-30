<?php

namespace App\Services;

use App\Models\LogKeluarHarian;
use App\Models\MatrixProgress;
use App\Models\Unit;

class MaterialConsumptionService
{
    public function evaluasiUnit(Unit $unit, float $progressPercent): array
    {
        $tahap = MatrixProgress::with('details.material')
            ->where('master_standar_id', $unit->master_standar_id)
            ->where('batas_atas', '<=', $progressPercent)
            ->orderBy('batas_atas', 'desc')
            ->first();

        if (!$tahap) {
            return ['status' => 'Aman', 'tahap' => null, 'detail' => []];
        }

        $detail = [];
        $statusUnit = 'Aman';

        foreach ($tahap->details as $std) {
            $qtyAktual = LogKeluarHarian::where('unit_id', $unit->id)
                ->where('material_id', $std->material_id)
                ->sum('qty');

            $qtyStandar   = (float) $std->qty_standar;
            $batasWarning = (float) $std->batas_warning; // mis. 1.00 atau 1.10 (Semen)
            $batasBoros   = (float) $std->batas_boros;   // mis. 1.15 atau 1.30 (Semen)

            $status = match (true) {
                $qtyAktual > $qtyStandar * $batasBoros   => 'Boros',
                $qtyAktual > $qtyStandar * $batasWarning => 'Warning',
                default => 'Aman',
            };

            if ($status === 'Boros') {
                $statusUnit = 'Boros';
            } elseif ($status === 'Warning' && $statusUnit !== 'Boros') {
                $statusUnit = 'Warning';
            }

           $detail[] = [
                'material'    => $std->material->nama_material,
                'qty_aktual'  => $qtyAktual,
                'qty_standar' => $qtyStandar,
                'sisa'        => $qtyAktual - $qtyStandar,
                'status'      => $status,
            ];
        }

        return ['status' => $statusUnit, 'tahap' => $tahap->tahap_pekerjaan, 'detail' => $detail];
    }
}