<?php

namespace App\Http\Controllers;

use App\Models\LogKeluarHarian;
use App\Models\Material;
use App\Models\Unit;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @OA\Tag(
 *     name="Keuangan - Kartu Material Unit",
 *     description="Laporan penggunaan material per unit"
 * )
 */
class KartuMaterialUnitController extends Controller
{
    /**
     * @OA\Get(
     *     path="/finance/kartu-material-unit",
     *     tags={"Keuangan - Kartu Material Unit"},
     *     summary="Halaman kartu material per unit",
     *     security={{"sanctum": {}}},
     *     @OA\Response(response=200, description="Halaman kartu material unit")
     * )
     */
    public function index(): Response
    {
        $units = Unit::query()
            ->select(['id', 'nama_unit', 'zona'])
            ->orderBy('nama_unit')
            ->get();

        $materials = Material::query()
            ->orderBy('nama_material')
            ->get(['id', 'nama_material', 'satuan']);

        $materialList = $materials->pluck('nama_material')->all();
        $materialSatuan = $materials->pluck('satuan', 'nama_material')->all();

        $pemakaian = LogKeluarHarian::query()
            ->selectRaw('unit_id, material_id, SUM(qty) as total_qty')
            ->groupBy('unit_id', 'material_id')
            ->get()
            ->groupBy('unit_id');

        $rows = $units->map(function (Unit $unit) use ($pemakaian, $materials) {
            $usage = [];
            foreach ($pemakaian->get($unit->id, collect()) as $log) {
                $materialName = $materials->firstWhere('id', $log->material_id)?->nama_material;

                if ($materialName) {
                    $usage[$materialName] = (float) $log->total_qty;
                }
            }

            return [
                'id' => $unit->nama_unit,
                'zona' => $unit->zona,
                'progress' => (int) ($unit->latestProgress?->progress_percent ?? 0),
                'usage' => $usage,
            ];
        })->values();

        return Inertia::render('KartuMaterialUnit/KartuMaterialUnit', [
            'units' => $rows,
            'materialList' => $materialList,
            'materialSatuan' => $materialSatuan,
        ]);
    }
}
